import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Lead, LeadStatus, LeadSource, LeadPriority } from './lead.entity';
import { LeadCommunication, CommunicationType, CommunicationDirection, CommunicationOutcome } from './lead-communication.entity';
import { LeadNote, NoteType } from './lead-note.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { WorkloadUpdateService } from '../users/workload-update.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadActivityType } from './lead-activity-log.entity';
import { CrmNotificationService } from './crm-notification.service';
import { LeadStatus as LeadStatusEntity } from './lead-status.entity';

export interface CreateLeadDto {
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  sourceDetails?: string;
  priority?: LeadPriority;
  initialNotes?: string;
  interests?: string;
  budgetRange?: number;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  generatedByUserId?: string;
  assignedToUserId?: string;
  tags?: string[];
  leadId?: string; // Optional: from CSV import
  dueDate?: Date;
  statusId?: string;
}

export interface UpdateLeadDto {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  statusId?: string;
  priority?: LeadPriority;
  interests?: string;
  budgetRange?: number;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  assignedToUserId?: string;
  nextFollowUpAt?: Date;
  dueDate?: Date;
  tags?: string[];
}

export interface CreateCommunicationDto {
  leadId: string;
  userId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  outcome?: CommunicationOutcome;
  subject: string;
  description: string;
  duration?: number;
  scheduledAt?: Date;
  completedAt?: Date;
  nextFollowUpAt?: Date;
  attachments?: string[];
  isImportant?: boolean;
}

export interface CreateNoteDto {
  leadId: string;
  userId: string;
  type?: NoteType;
  title: string;
  content: string;
  isImportant?: boolean;
  isPrivate?: boolean;
  tags?: string[];
  reminderAt?: Date;
}

export interface LeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assignedToUserId?: string;
  generatedByUserId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastContactedAfter?: Date;
  lastContactedBefore?: Date;
  search?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(LeadCommunication)
    private communicationRepository: Repository<LeadCommunication>,
    @InjectRepository(LeadNote)
    private noteRepository: Repository<LeadNote>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LeadStatusEntity)
    private leadStatusRepository: Repository<LeadStatusEntity>,
    private workloadUpdateService: WorkloadUpdateService,
    private activityService: LeadActivityService,
    private notificationService: CrmNotificationService,
  ) {}

  private parseTags(tagsString: string): string[] {
    if (!tagsString) return [];
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(tagsString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If JSON parsing fails, treat as comma-separated string
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }

  /**
   * Generate unique leadId if not provided
   */
  private async generateLeadId(): Promise<string> {
    // Get the latest lead to generate sequential ID
    const latestLead = await this.leadRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      select: ['leadId'],
    });

    let nextNumber = 1;
    if (latestLead?.leadId) {
      // Extract number from existing leadId (format: LEAD-000001)
      const match = latestLead.leadId.match(/LEAD-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format as LEAD-000001, LEAD-000002, etc.
    return `LEAD-${String(nextNumber).padStart(6, '0')}`;
  }

  async createLead(createLeadDto: CreateLeadDto, createdBy?: User): Promise<Lead> {
    // Validate that at least email or phone is provided
    if (!createLeadDto.email && !createLeadDto.phone) {
      throw new BadRequestException('Either email or phone number must be provided');
    }

    // Validate assigned user exists and is a sales agent
    let assignedUser: User | null = null;
    if (createLeadDto.assignedToUserId) {
      assignedUser = await this.userRepository.findOne({
        where: { id: createLeadDto.assignedToUserId }
      });
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Generate leadId if not provided
    let leadId = createLeadDto.leadId;
    if (!leadId) {
      leadId = await this.generateLeadId();
    } else {
      // Check if leadId already exists
      const existing = await this.leadRepository.findOne({
        where: { leadId },
      });
      if (existing) {
        // Generate a new one if duplicate
        leadId = await this.generateLeadId();
      }
    }

    // Get default status if statusId not provided
    let statusId = createLeadDto.statusId;
    if (!statusId) {
      const defaultStatus = await this.leadStatusRepository.findOne({
        where: { isDefault: true, isActive: true },
      });
      if (defaultStatus) {
        statusId = defaultStatus.id;
      }
    }

    const lead = this.leadRepository.create({
      ...createLeadDto,
      leadId,
      statusId,
      assignedToUserId: createLeadDto.assignedToUserId || null,
      generatedByUserId: createLeadDto.generatedByUserId || createdBy?.id || null,
      tags: createLeadDto.tags ? JSON.stringify(createLeadDto.tags) : null,
    });

    const savedLead = await this.leadRepository.save(lead);
    
    // Log activity
    await this.activityService.logLeadCreated(savedLead, createdBy || undefined);
    
    // Send notification if assigned
    if (assignedUser) {
      await this.notificationService.notifyLeadAssigned(savedLead, assignedUser, createdBy || undefined);
    }
    
    // Update workload score for the assigned agent
    if (savedLead.assignedToUserId) {
      await this.workloadUpdateService.updateAgentWorkload(savedLead.assignedToUserId);
    }
    
    return savedLead;
  }

  async getAllLeads(
    filters: LeadFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    currentUser?: { userId: string; role: string }
  ) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedToUser', 'assignedUser')
      .leftJoinAndSelect('lead.generatedByUser', 'generatedUser')
      .leftJoinAndSelect('lead.convertedByUser', 'convertedUser')
      .leftJoinAndSelect('lead.convertedToCustomer', 'customer');

    this.applyFilters(queryBuilder, filters);

    // Apply role-based filtering
    if (currentUser) {
      console.log('🔍 Applying role-based filtering:', {
        userId: currentUser.userId,
        role: currentUser.role
      });
      
      if (currentUser.role === 'sales_person') {
        // Sales team members can only see leads assigned to them
        console.log('👤 Sales person filtering: assignedToUserId =', currentUser.userId);
        queryBuilder.andWhere('lead.assignedToUserId = :userId', { userId: currentUser.userId });
      }
      // Sales managers and admins can see all leads (no additional filtering)
    } else {
      console.log('❌ No currentUser provided for role-based filtering');
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(lead.fullName LIKE :search OR lead.email LIKE :search OR lead.phone LIKE :search OR lead.sourceDetails LIKE :search OR lead.leadId LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const skip = (page - 1) * limit;
    const [leads, total] = await queryBuilder
      .orderBy(`lead.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Parse tags for each lead
    const leadsWithParsedTags = leads.map(lead => ({
      ...lead,
      tags: lead.tags ? this.parseTags(lead.tags) : [],
    } as Lead & { tags: string[] }));

    return {
      data: leadsWithParsedTags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Lead>, filters: LeadFilters) {
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('lead.status IN (:...status)', { status: filters.status });
    }

    if (filters.source && filters.source.length > 0) {
      queryBuilder.andWhere('lead.source IN (:...source)', { source: filters.source });
    }

    if (filters.priority && filters.priority.length > 0) {
      queryBuilder.andWhere('lead.priority IN (:...priority)', { priority: filters.priority });
    }

    if (filters.assignedToUserId) {
      queryBuilder.andWhere('lead.assignedToUserId = :assignedToUserId', { 
        assignedToUserId: filters.assignedToUserId 
      });
    }

    if (filters.generatedByUserId) {
      queryBuilder.andWhere('lead.generatedByUserId = :generatedByUserId', { 
        generatedByUserId: filters.generatedByUserId 
      });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('lead.createdAt >= :createdAfter', { createdAfter: filters.createdAfter });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('lead.createdAt <= :createdBefore', { createdBefore: filters.createdBefore });
    }

    if (filters.lastContactedAfter) {
      queryBuilder.andWhere('lead.lastContactedAt >= :lastContactedAfter', { 
        lastContactedAfter: filters.lastContactedAfter 
      });
    }

    if (filters.lastContactedBefore) {
      queryBuilder.andWhere('lead.lastContactedAt <= :lastContactedBefore', { 
        lastContactedBefore: filters.lastContactedBefore 
      });
    }
  }

  async getLeadById(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: [
        'assignedToUser',
        'generatedByUser',
        'convertedByUser',
        'convertedToCustomer',
        'communications',
        'communications.user',
        'notes',
        'notes.user'
      ],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return {
      ...lead,
      tags: lead.tags ? this.parseTags(lead.tags) : [],
    } as Lead & { tags: string[] };
  }

  async updateLead(id: string, updateLeadDto: UpdateLeadDto, updatedBy?: User): Promise<Lead> {
    const lead = await this.getLeadById(id);
    const oldAssignedUserId = lead.assignedToUserId;
    const oldStatus = lead.status;
    const oldPriority = lead.priority;
    const oldDueDate = lead.dueDate;

    // Validate assigned user if provided
    let newAssignedUser: User | null = null;
    if (updateLeadDto.assignedToUserId) {
      newAssignedUser = await this.userRepository.findOne({
        where: { id: updateLeadDto.assignedToUserId }
      });
      if (!newAssignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Track what changed for activity logging
    const updatedFields: string[] = [];
    if (updateLeadDto.fullName && updateLeadDto.fullName !== lead.fullName) updatedFields.push('fullName');
    if (updateLeadDto.email && updateLeadDto.email !== lead.email) updatedFields.push('email');
    if (updateLeadDto.phone && updateLeadDto.phone !== lead.phone) updatedFields.push('phone');
    if (updateLeadDto.status && updateLeadDto.status !== lead.status) updatedFields.push('status');
    if (updateLeadDto.priority && updateLeadDto.priority !== lead.priority) updatedFields.push('priority');
    if (updateLeadDto.assignedToUserId && updateLeadDto.assignedToUserId !== lead.assignedToUserId) updatedFields.push('assignedToUserId');
    if (updateLeadDto.dueDate && updateLeadDto.dueDate !== lead.dueDate) updatedFields.push('dueDate');

    const updateData: any = {
      ...updateLeadDto,
      assignedToUserId: updateLeadDto.assignedToUserId !== undefined ? (updateLeadDto.assignedToUserId || null) : lead.assignedToUserId,
      tags: updateLeadDto.tags ? JSON.stringify(updateLeadDto.tags) : lead.tags,
    };

    // Update lead
    await this.leadRepository.update(lead.id, updateData);
    
    // Get updated lead
    const updatedLead = await this.getLeadById(id);
    
    // Log activities
    if (updateLeadDto.status && updateLeadDto.status !== oldStatus) {
      await this.activityService.logStatusChange(updatedLead, oldStatus, updateLeadDto.status, updatedBy);
      
      // Notify manager if status changed by sales person
      if (updatedBy && updatedBy.role === 'sales_person' && updatedLead.assignedToUser) {
        const manager = await this.userRepository.findOne({
          where: { id: updatedLead.assignedToUser.assignedToUserId },
        });
        if (manager) {
          await this.notificationService.notifyStatusChanged(
            updatedLead,
            manager,
            oldStatus,
            updateLeadDto.status,
            updatedBy,
          );
        }
      }
    }

    if (updateLeadDto.priority && updateLeadDto.priority !== oldPriority) {
      await this.activityService.logPriorityChange(updatedLead, oldPriority, updateLeadDto.priority, updatedBy);
    }

    if (updateLeadDto.assignedToUserId && updateLeadDto.assignedToUserId !== oldAssignedUserId) {
      const oldAssignedUser = oldAssignedUserId ? await this.userRepository.findOne({ where: { id: oldAssignedUserId } }) : null;
      await this.activityService.logAssignment(
        updatedLead, 
        oldAssignedUserId, 
        updateLeadDto.assignedToUserId, 
        updatedBy,
        oldAssignedUser?.fullName,
        newAssignedUser?.fullName,
      );
      
      // Send notifications
      if (newAssignedUser) {
        await this.notificationService.notifyLeadReassigned(
          updatedLead,
          newAssignedUser,
          oldAssignedUser || undefined,
          updatedBy,
        );
      }
    }

    if (updateLeadDto.dueDate && updateLeadDto.dueDate !== oldDueDate) {
      await this.activityService.logDueDateChange(updatedLead, oldDueDate, updateLeadDto.dueDate, updatedBy);
    }

    if (updatedFields.length > 0) {
      await this.activityService.logUpdate(updatedLead, updatedFields, updatedBy);
    }
    
    // Update workload scores if assignment changed
    if (oldAssignedUserId !== updatedLead.assignedToUserId) {
      await this.workloadUpdateService.handleLeadAssignment(
        id, 
        oldAssignedUserId, 
        updatedLead.assignedToUserId
      );
    }
    
    return updatedLead;
  }

  async deleteLead(id: string, deletedBy?: User): Promise<void> {
    const lead = await this.getLeadById(id);
    
    // Log activity before deleting
    const leadName = lead.fullName || lead.leadId || 'Lead';
    const userName = deletedBy?.fullName || 'User';
    await this.activityService.logActivity(
      lead.id,
      LeadActivityType.UPDATED, // Using UPDATED as there's no DELETED type, but we can track it
      `${userName} deleted lead: ${leadName}`,
      deletedBy?.id,
      {
        action: 'deleted',
        leadName: lead.fullName,
        leadId: lead.leadId,
      },
    );
    
    // Update workload score for the assigned agent before deleting
    if (lead.assignedToUserId) {
      await this.workloadUpdateService.updateAgentWorkload(lead.assignedToUserId);
    }
    
    await this.leadRepository.remove(lead);
  }

  async convertLeadToCustomer(
    leadId: string,
    customerData: {
      cnic: string;
      address: string;
    },
    convertedByUserId: string
  ): Promise<{ lead: Lead; customer: Customer }> {
    const convertedBy = await this.userRepository.findOne({ where: { id: convertedByUserId } });
    const lead = await this.getLeadById(leadId);
    
    // Check if lead is already converted (using close_won status)
    if (lead.status === LeadStatus.CLOSE_WON) {
      throw new BadRequestException('Lead is already converted');
    }

    // Create customer from lead data
    const customer = this.customerRepository.create({
      cnic: customerData.cnic,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      address: customerData.address,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Update lead status to close_won (converted)
    lead.status = LeadStatus.CLOSE_WON;
    lead.convertedToCustomerId = savedCustomer.id;
    lead.convertedByUserId = convertedByUserId;
    lead.convertedAt = new Date();

    const updatedLead = await this.leadRepository.save(lead);

    // Log activity
    await this.activityService.logConversion(updatedLead, savedCustomer.id, convertedBy || undefined);

    return { lead: updatedLead, customer: savedCustomer };
  }

  // Communication methods
  async addCommunication(createCommunicationDto: CreateCommunicationDto, addedBy?: User): Promise<LeadCommunication> {
    const lead = await this.getLeadById(createCommunicationDto.leadId);
    
    const communication = this.communicationRepository.create({
      ...createCommunicationDto,
      attachments: createCommunicationDto.attachments ? JSON.stringify(createCommunicationDto.attachments) : null,
    });

    const savedCommunication = await this.communicationRepository.save(communication);

    // Update lead's last contacted date
    lead.lastContactedAt = new Date();
    if (createCommunicationDto.nextFollowUpAt) {
      lead.nextFollowUpAt = createCommunicationDto.nextFollowUpAt;
    }
    await this.leadRepository.save(lead);

    // Log activity with outcome
    const communicationType = `${createCommunicationDto.type} - ${createCommunicationDto.direction}`;
    const outcome = createCommunicationDto.outcome || undefined;
    await this.activityService.logCommunication(
      lead,
      communicationType,
      addedBy,
      outcome,
    );

    return savedCommunication;
  }

  async getLeadCommunications(leadId: string): Promise<LeadCommunication[]> {
    return await this.communicationRepository.find({
      where: { leadId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Note methods
  async addNote(createNoteDto: CreateNoteDto, addedBy?: User): Promise<LeadNote> {
    const lead = await this.getLeadById(createNoteDto.leadId); // Validate lead exists

    const note = this.noteRepository.create({
      ...createNoteDto,
      tags: createNoteDto.tags ? JSON.stringify(createNoteDto.tags) : null,
    });

    const savedNote = await this.noteRepository.save(note);

    // Log activity
    await this.activityService.logNoteAdded(lead, createNoteDto.title, addedBy);

    return savedNote;
  }

  async getLeadNotes(leadId: string, userId?: string): Promise<LeadNote[]> {
    const queryBuilder = this.noteRepository.createQueryBuilder('note')
      .leftJoinAndSelect('note.user', 'user')
      .where('note.leadId = :leadId', { leadId })
      .orderBy('note.createdAt', 'DESC');

    // If userId is provided, filter private notes
    if (userId) {
      queryBuilder.andWhere('(note.isPrivate = false OR note.userId = :userId)', { userId });
    } else {
      queryBuilder.andWhere('note.isPrivate = false');
    }

    return await queryBuilder.getMany();
  }

  // Analytics methods
  async getLeadStats(filters: LeadFilters = {}, currentUser?: { userId: string; role: string }) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    this.applyFilters(queryBuilder, filters);

    // Apply role-based filtering (same as getAllLeads)
    if (currentUser) {
      console.log('📊 Applying role-based filtering to stats:', {
        userId: currentUser.userId,
        role: currentUser.role
      });
      
      if (currentUser.role === 'sales_person') {
        // Sales team members can only see stats for leads assigned to them
        console.log('👤 Sales person stats filtering: assignedToUserId =', currentUser.userId);
        queryBuilder.andWhere('lead.assignedToUserId = :userId', { userId: currentUser.userId });
      }
      // Sales managers and admins can see all leads (no additional filtering)
    } else {
      console.log('❌ No currentUser provided for stats role-based filtering');
    }

    // Get all active statuses from database
    const allStatuses = await this.leadStatusRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });

    const [
      totalLeads,
      newLeads,
      notInterestedLeads,
      interestedLeads,
      willVisitLeads,
      futureLeads,
      closeWonLeads,
      inProcessLeads
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.NEW }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.NOT_INTERESTED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.INTERESTED }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.WILL_VISIT }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.FUTURE }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.CLOSE_WON }).getCount(),
      queryBuilder.clone().andWhere('lead.status = :status', { status: LeadStatus.IN_PROCESS }).getCount(),
    ]);

    const conversionRate = totalLeads > 0 ? (closeWonLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      newLeads,
      notInterestedLeads,
      interestedLeads,
      willVisitLeads,
      futureLeads,
      closeWonLeads,
      inProcessLeads,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  async getLeadsBySource(filters: LeadFilters = {}) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    this.applyFilters(queryBuilder, filters);

    const results = await queryBuilder
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.source')
      .getRawMany();

    return results.map(result => ({
      source: result.source,
      count: parseInt(result.count),
    }));
  }

  /**
   * Get all lead statuses (only the new 7 statuses)
   */
  async getLeadStatuses() {
    const validStatusNames = [
      'new',
      'not_interested',
      'interested',
      'will_visit',
      'future',
      'close_won',
      'in_process'
    ];
    
    return await this.leadStatusRepository.find({
      where: { 
        isActive: true,
        name: In(validStatusNames)
      },
      order: { order: 'ASC' },
    });
  }

  /**
   * Get lead status metrics (count by status)
   */
  async getLeadStatusMetrics(filters: LeadFilters = {}, currentUser?: { userId: string; role: string }) {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');
    this.applyFilters(queryBuilder, filters);

    // Apply role-based filtering
    if (currentUser) {
      if (currentUser.role === 'sales_person') {
        queryBuilder.andWhere('lead.assignedToUserId = :userId', { userId: currentUser.userId });
      }
    }

    // Get all active statuses
    const statuses = await this.leadStatusRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });

    // Get counts for each status
    const metrics: Record<string, number> = {};
    for (const status of statuses) {
      const count = await queryBuilder
        .clone()
        .andWhere('lead.status = :status', { status: status.name })
        .getCount();
      metrics[status.name] = count;
    }

    // Also get total count
    const total = await queryBuilder.getCount();

    return {
      statuses: statuses.map(status => ({
        id: status.id,
        name: status.name,
        displayName: status.displayName,
        color: status.color,
        count: metrics[status.name] || 0,
      })),
      total,
    };
  }

  /**
   * Update lead status using statusId
   */
  async updateLeadStatus(leadId: string, statusId: string, updatedBy?: User): Promise<Lead> {
    const lead = await this.getLeadById(leadId);
    const oldStatus = lead.status;
    const oldStatusId = lead.statusId;

    // Get the status entity to get the name
    const statusEntity = await this.leadStatusRepository.findOne({
      where: { id: statusId },
    });

    if (!statusEntity) {
      throw new NotFoundException('Lead status not found');
    }

    // Update lead
    await this.leadRepository.update(leadId, {
      statusId,
      status: statusEntity.name as LeadStatus,
    });

    const updatedLead = await this.getLeadById(leadId);

    // Log activity
    if (oldStatus !== updatedLead.status) {
      await this.activityService.logStatusChange(
        updatedLead,
        oldStatus,
        updatedLead.status,
        updatedBy,
      );

      // Notify manager if status changed by sales person
      if (updatedBy && updatedBy.role === 'sales_person' && updatedLead.assignedToUser) {
        const manager = await this.userRepository.findOne({
          where: { id: updatedLead.assignedToUser.assignedToUserId },
        });
        if (manager) {
          await this.notificationService.notifyStatusChanged(
            updatedLead,
            manager,
            oldStatus,
            updatedLead.status,
            updatedBy,
          );
        }
      }
    }

    return updatedLead;
  }
}
