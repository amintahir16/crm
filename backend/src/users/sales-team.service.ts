import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { SalesActivity } from './sales-activity.entity';
import { LeadActivityLog } from '../leads/lead-activity-log.entity';
import { CreateTeamMemberDto, UpdateTeamMemberDto, AssignLeadDto } from './dto/sales-team.dto';
import { LiveWorkloadService } from './live-workload.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SalesTeamService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(SalesActivity)
    private salesActivityRepository: Repository<SalesActivity>,
    @InjectRepository(LeadActivityLog)
    private leadActivityLogRepository: Repository<LeadActivityLog>,
    private liveWorkloadService: LiveWorkloadService,
  ) {}

  /**
   * Get all team members managed by a sales manager
   */
  async getTeamMembers(managerId: string): Promise<any[]> {
    // Get team members (including inactive ones)
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      },
      select: [
        'id', 'fullName', 'email', 'phone', 'department', 
        'employeeId', 'createdAt', 'isActive'
      ],
      order: {
        isActive: 'DESC', // Active members first
        fullName: 'ASC'
      }
    });

    // Get live workload data for each team member
    const membersWithLiveWorkload = await Promise.all(
      teamMembers.map(async (member) => {
        const workloadData = await this.liveWorkloadService.getAgentWorkload(member.id);
        return {
          ...member,
          workloadScore: workloadData.workloadScore
        };
      })
    );

    return membersWithLiveWorkload;
  }

  /**
   * Create a new team member
   */
  async createTeamMember(managerId: string, createDto: CreateTeamMemberDto): Promise<User> {
    // Verify manager exists and is a sales manager
    const manager = await this.userRepository.findOne({
      where: { 
        id: managerId,
        role: UserRole.SALES_MANAGER,
        isActive: true
      }
    });

    if (!manager) {
      throw new NotFoundException('Sales manager not found');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const teamMember = this.userRepository.create({
      fullName: createDto.fullName,
      email: createDto.email,
      passwordHash,
      role: UserRole.SALES_PERSON,
      assignedToUserId: managerId,
      department: createDto.department || 'Sales',
      employeeId: createDto.employeeId,
      phone: createDto.phone,
      address: createDto.address,
      workloadScore: 0,
      isActive: true
    });

    return await this.userRepository.save(teamMember);
  }

  /**
   * Get detailed information about a specific team member
   */
  async getTeamMemberDetails(managerId: string, memberId: string): Promise<any> {
    // Verify the team member belongs to this manager
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: memberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      },
      select: [
        'id', 'fullName', 'email', 'phone', 'department', 
        'employeeId', 'address', 'createdAt', 'isActive'
      ]
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Get live workload data
    const workloadData = await this.liveWorkloadService.getAgentWorkload(memberId);

    // Get performance metrics
    const [
      totalLeads,
      convertedLeads,
      activeLeads,
      lostLeads,
      notInterestedLeads,
      totalBookings,
      totalRevenue,
      activitiesCount,
      recentActivities,
      recentSales
    ] = await Promise.all([
      // Total leads
      this.leadRepository.count({ where: { assignedToUserId: memberId } }),
      // Converted leads
      this.leadRepository.count({ where: { assignedToUserId: memberId, status: LeadStatus.CLOSE_WON } }),
      // Active leads (excluding converted, lost, not_interested)
      this.leadRepository.count({ 
        where: { 
          assignedToUserId: memberId,
          status: Not(In([LeadStatus.CLOSE_WON, LeadStatus.NOT_INTERESTED]))
        }
      }),
      // Lost leads
      this.leadRepository.count({ where: { assignedToUserId: memberId, status: LeadStatus.NOT_INTERESTED } }),
      // Not interested leads
      this.leadRepository.count({ where: { assignedToUserId: memberId, status: LeadStatus.NOT_INTERESTED } }),
      // Total bookings
      this.bookingRepository.count({ where: { createdById: memberId } }),
      // Total revenue
      this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.totalAmount)', 'total')
        .where('booking.createdById = :memberId', { memberId })
        .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
        .getRawOne(),
      // Activities count
      this.salesActivityRepository.count({ where: { userId: memberId } }),
      // Recent activities (last 10)
      this.salesActivityRepository.find({
        where: { userId: memberId },
        order: { createdAt: 'DESC' },
        take: 10
      }),
      // Recent sales/bookings (last 10)
      this.bookingRepository.find({
        where: { createdById: memberId },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['customer', 'plot']
      })
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const averageDealSize = totalBookings > 0 ? (parseFloat(totalRevenue.total) || 0) / totalBookings : 0;

    return {
      ...teamMember,
      workloadScore: workloadData.workloadScore,
      performance: {
        totalLeads,
        convertedLeads,
        activeLeads,
        lostLeads,
        notInterestedLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalBookings,
        totalRevenue: parseFloat(totalRevenue.total) || 0,
        averageDealSize: Math.round(averageDealSize),
        activitiesCount
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        description: activity.description,
        createdAt: activity.createdAt,
        entityId: activity.entityId,
        entityType: activity.entityType,
        isSuccessful: activity.isSuccessful,
        potentialValue: activity.potentialValue
      })),
      recentSales: recentSales.map(booking => ({
        id: booking.id,
        bookingNumber: `BK-${booking.id.slice(-8).toUpperCase()}`,
        customerName: booking.customer?.fullName || 'Unknown Customer',
        customerId: booking.customerId,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        plotNumber: booking.plot?.plotNumber || 'N/A',
        plotSize: booking.plot?.sizeMarla ? `${booking.plot.sizeMarla} Marla` : 'N/A'
      }))
    };
  }

  /**
   * Update team member information
   */
  async updateTeamMember(
    managerId: string, 
    memberId: string, 
    updateDto: UpdateTeamMemberDto
  ): Promise<User> {
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: memberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    Object.assign(teamMember, updateDto);
    return await this.userRepository.save(teamMember);
  }

  /**
   * Remove team member (soft delete)
   */
  async removeTeamMember(managerId: string, memberId: string): Promise<void> {
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: memberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    teamMember.isActive = false;
    await this.userRepository.save(teamMember);
  }

  /**
   * Get team member workload for lead assignment
   */
  async getTeamWorkload(managerId: string): Promise<{ userId: string; fullName: string; workloadScore: number }[]> {
    // Get team members
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName']
    });

    // Get live workload data for each team member
    const workloads = await Promise.all(
      teamMembers.map(async (member) => {
        const workload = await this.liveWorkloadService.getAgentWorkload(member.id);
        return {
          userId: member.id,
          fullName: member.fullName,
          workloadScore: workload.workloadScore
        };
      })
    );

    return workloads;
  }

  /**
   * Update team member workload score
   */
  async updateWorkloadScore(memberId: string, score: number): Promise<void> {
    await this.userRepository.update(
      { id: memberId, role: UserRole.SALES_PERSON },
      { workloadScore: score }
    );
  }

  /**
   * Get next available team member for lead assignment
   */
  async getNextAvailableTeamMember(managerId: string): Promise<string | null> {
    // Use live workload service to get the next available agent
    return await this.liveWorkloadService.getNextAvailableAgent();
  }

  /**
   * Assign lead to team member
   */
  async assignLeadToTeamMember(managerId: string, assignDto: AssignLeadDto): Promise<void> {
    // Verify team member belongs to this manager
    const teamMember = await this.userRepository.findOne({
      where: { 
        id: assignDto.teamMemberId,
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      }
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Update workload score
    await this.updateWorkloadScore(assignDto.teamMemberId, teamMember.workloadScore + 1);
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(managerId: string, startDate?: Date, endDate?: Date) {
    const teamMembers = await this.getTeamMembers(managerId);
    const teamMemberIds = teamMembers.map(member => member.id);
    
    if (teamMemberIds.length === 0) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        averageWorkload: 0,
        averageConversionRate: 0,
        totalRevenue: 0,
        topPerformer: '',
        teamGoal: 1000000,
        goalProgress: 0,
        monthlyTarget: 500000,
        monthlyProgress: 0,
        members: []
      };
    }

    // Get performance data for each team member
    const performanceData = await Promise.all(
      teamMembers.map(async (member) => {
        const [leadsCount, convertedLeads, bookingsCount, totalSales, activitiesCount] = await Promise.all([
          this.leadRepository.count({ where: { assignedToUserId: member.id } }),
          this.leadRepository.count({ where: { assignedToUserId: member.id, status: LeadStatus.CLOSE_WON } }),
          this.bookingRepository.count({ where: { createdById: member.id } }),
          this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(booking.totalAmount)', 'total')
            .where('booking.createdById = :memberId', { memberId: member.id })
            .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
            .getRawOne(),
          this.salesActivityRepository.count({ where: { userId: member.id } })
        ]);

        const conversionRate = leadsCount > 0 ? (convertedLeads / leadsCount) * 100 : 0;
        const averageDealSize = bookingsCount > 0 ? (parseFloat(totalSales.total) || 0) / bookingsCount : 0;

        // Get live workload data
        const workloadData = await this.liveWorkloadService.getAgentWorkload(member.id);

        return {
          id: member.id,
          name: member.fullName,
          email: member.email,
          role: 'Sales Agent',
          workloadScore: workloadData.workloadScore,
          totalLeads: leadsCount,
          convertedLeads,
          conversionRate,
          totalBookings: bookingsCount,
          totalRevenue: parseFloat(totalSales.total) || 0,
          averageDealSize,
          activitiesCount,
          lastActivity: new Date().toISOString(),
          performanceScore: conversionRate
        };
      })
    );

    // Calculate team metrics
    const totalMembers = performanceData.length;
    const activeMembers = performanceData.filter(m => m.totalLeads > 0).length;
    const averageWorkload = totalMembers > 0 ? performanceData.reduce((sum, m) => sum + m.workloadScore, 0) / totalMembers : 0;
    const averageConversionRate = totalMembers > 0 ? performanceData.reduce((sum, m) => sum + m.conversionRate, 0) / totalMembers : 0;
    const totalRevenue = performanceData.reduce((sum, m) => sum + m.totalRevenue, 0);
    const topPerformer = performanceData.length > 0 
      ? performanceData.reduce((top, member) => member.conversionRate > top.conversionRate ? member : top).name
      : '';

    return {
      totalMembers,
      activeMembers,
      averageWorkload,
      averageConversionRate,
      totalRevenue,
      topPerformer,
      teamGoal: 1000000,
      goalProgress: (totalRevenue / 1000000) * 100,
      monthlyTarget: 500000,
      monthlyProgress: (totalRevenue / 500000) * 100,
      members: performanceData
    };
  }

  /**
   * Get manager dashboard stats with actual revenue from confirmed bookings
   */
  async getManagerStats(managerId: string): Promise<any> {
    const teamMembers = await this.getTeamMembers(managerId);
    const teamMemberIds = teamMembers.map(member => member.id);
    
    if (teamMemberIds.length === 0) {
      return {
        totalLeads: 0,
        convertedLeads: 0,
        totalCustomers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingFollowUps: 0,
        callsMade: 0,
        emailsSent: 0,
        meetingsScheduled: 0,
        conversionRate: 0,
      };
    }

    // Get actual stats from database
    const [
      totalLeads,
      convertedLeads,
      totalCustomers,
      totalBookings,
      totalRevenue,
      activitiesStats
    ] = await Promise.all([
      // Total leads assigned to team members
      this.leadRepository.count({
        where: { assignedToUserId: In(teamMemberIds) }
      }),
      // Converted leads
      this.leadRepository.count({
        where: { 
          assignedToUserId: In(teamMemberIds),
          status: LeadStatus.CLOSE_WON 
        }
      }),
      // Total customers created by team members
      this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.customer', 'customer')
        .where('booking.createdById IN (:...memberIds)', { memberIds: teamMemberIds })
        .select('COUNT(DISTINCT customer.id)', 'count')
        .getRawOne(),
      // Total bookings created by team members
      this.bookingRepository.count({
        where: { createdById: In(teamMemberIds) }
      }),
      // Total revenue from confirmed bookings
      this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.totalAmount)', 'total')
        .where('booking.createdById IN (:...memberIds)', { memberIds: teamMemberIds })
        .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
        .getRawOne(),
      // Activities stats
      this.salesActivityRepository
        .createQueryBuilder('activity')
        .where('activity.userId IN (:...memberIds)', { memberIds: teamMemberIds })
        .select([
          'COUNT(CASE WHEN activity.activityType = :callMade THEN 1 END) as callsMade',
          'COUNT(CASE WHEN activity.activityType = :emailSent THEN 1 END) as emailsSent',
          'COUNT(CASE WHEN activity.activityType = :meetingScheduled THEN 1 END) as meetingsScheduled'
        ])
        .setParameters({
          callMade: 'call_made',
          emailSent: 'email_sent',
          meetingScheduled: 'meeting_scheduled'
        })
        .getRawOne()
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Get recent activities from lead_activity_log
    const recentActivities = await this.leadActivityLogRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.lead', 'lead')
      .where('activity.userId IN (:...teamMemberIds)', { teamMemberIds })
      .orderBy('activity.createdAt', 'DESC')
      .take(20)
      .getMany();

    const formattedActivities = recentActivities.map(activity => {
      const leadName = activity.lead?.fullName || activity.lead?.leadId || 'Unknown Lead';
      const userName = activity.user?.fullName || 'Unknown User';
      
      // Format description based on activity type
      let formattedDescription = activity.description;
      if (activity.metadata) {
        try {
          const metadata = JSON.parse(activity.metadata);
          
          switch (activity.activityType) {
            case 'communication_added':
              formattedDescription = `${userName} communicated with ${leadName} - ${metadata.communicationType || 'Communication'}`;
              if (metadata.outcome) {
                formattedDescription += ` (Outcome: ${metadata.outcome})`;
              }
              break;
            case 'note_added':
              formattedDescription = `${userName} added a note for ${leadName}: "${metadata.noteTitle || 'Note'}"`;
              break;
            case 'status_changed':
              formattedDescription = `${userName} changed status for ${leadName} from "${metadata.oldStatus || 'Unknown'}" to "${metadata.newStatus || 'Unknown'}"`;
              break;
            case 'assigned':
            case 'reassigned':
              formattedDescription = `${userName} ${activity.activityType === 'assigned' ? 'assigned' : 'reassigned'} ${leadName}`;
              break;
            case 'created':
              formattedDescription = `${userName} created lead: ${leadName}`;
              break;
            case 'converted':
              formattedDescription = `${userName} converted ${leadName} to customer`;
              break;
            default:
              formattedDescription = `${userName}: ${activity.description}`;
          }
        } catch (e) {
          formattedDescription = `${userName}: ${activity.description}`;
        }
      } else {
        formattedDescription = `${userName}: ${activity.description}`;
      }

      return {
        id: activity.id,
        type: activity.activityType,
        description: formattedDescription,
        userName: userName,
        leadName: leadName,
        leadId: activity.leadId,
        createdAt: activity.createdAt,
        timestamp: activity.createdAt,
      };
    });

    return {
      totalLeads,
      convertedLeads,
      totalCustomers: parseInt(totalCustomers.count) || 0,
      totalBookings,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      pendingFollowUps: 0, // This would need a separate calculation
      callsMade: parseInt(activitiesStats.callsMade) || 0,
      emailsSent: parseInt(activitiesStats.emailsSent) || 0,
      meetingsScheduled: parseInt(activitiesStats.meetingsScheduled) || 0,
      conversionRate: Math.round(conversionRate * 10) / 10,
      recentActivities: formattedActivities,
    };
  }

  /**
   * Get sales agent dashboard stats with actual data from leads and bookings
   */
  async getAgentStats(agentId: string): Promise<any> {
    // Get actual stats from database for this specific agent
    const [
      totalLeads,
      convertedLeads,
      totalCustomers,
      totalBookings,
      totalRevenue,
      activitiesStats
    ] = await Promise.all([
      // Total leads assigned to this agent
      this.leadRepository.count({
        where: { assignedToUserId: agentId }
      }),
      // Converted leads
      this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: LeadStatus.CLOSE_WON 
        }
      }),
      // Total customers created by this agent
      this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.customer', 'customer')
        .where('booking.createdById = :agentId', { agentId })
        .select('COUNT(DISTINCT customer.id)', 'count')
        .getRawOne(),
      // Total bookings created by this agent
      this.bookingRepository.count({
        where: { createdById: agentId }
      }),
      // Total revenue from confirmed bookings
      this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.totalAmount)', 'total')
        .where('booking.createdById = :agentId', { agentId })
        .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
        .getRawOne(),
      // Activities stats
      this.salesActivityRepository
        .createQueryBuilder('activity')
        .where('activity.userId = :agentId', { agentId })
        .select([
          'COUNT(CASE WHEN activity.activityType = :callMade THEN 1 END) as callsMade',
          'COUNT(CASE WHEN activity.activityType = :emailSent THEN 1 END) as emailsSent',
          'COUNT(CASE WHEN activity.activityType = :meetingScheduled THEN 1 END) as meetingsScheduled'
        ])
        .setParameters({
          callMade: 'call_made',
          emailSent: 'email_sent',
          meetingScheduled: 'meeting_scheduled'
        })
        .getRawOne()
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      convertedLeads,
      totalCustomers: parseInt(totalCustomers.count) || 0,
      totalBookings,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      pendingFollowUps: 0, // This would need a separate calculation
      callsMade: parseInt(activitiesStats.callsMade) || 0,
      emailsSent: parseInt(activitiesStats.emailsSent) || 0,
      meetingsScheduled: parseInt(activitiesStats.meetingsScheduled) || 0,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }
}
