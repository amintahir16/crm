import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Lead, LeadStatus } from './lead.entity';
import { User } from '../users/user.entity';
import { Notification } from '../communication/notification.entity';
import { NotificationType, NotificationPriority, NotificationStatus } from '../communication/notification.entity';

export interface WorkflowRule {
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
  condition: string;
  daysDelay?: number;
  action: 'auto' | 'notification' | 'both';
}

@Injectable()
export class LeadWorkflowService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Define workflow rules
  private readonly workflowRules: WorkflowRule[] = [
    {
      fromStatus: LeadStatus.NEW,
      toStatus: LeadStatus.IN_PROCESS,
      condition: 'contact_attempted',
      daysDelay: 1,
      action: 'notification'
    },
    {
      fromStatus: LeadStatus.IN_PROCESS,
      toStatus: LeadStatus.INTERESTED,
      condition: 'qualification_completed',
      daysDelay: 3,
      action: 'notification'
    },
    {
      fromStatus: LeadStatus.INTERESTED,
      toStatus: LeadStatus.WILL_VISIT,
      condition: 'interest_expressed',
      daysDelay: 2,
      action: 'notification'
    },
    {
      fromStatus: LeadStatus.WILL_VISIT,
      toStatus: LeadStatus.CLOSE_WON,
      condition: 'booking_created',
      daysDelay: 0,
      action: 'auto'
    },
    {
      fromStatus: LeadStatus.NEW,
      toStatus: LeadStatus.NOT_INTERESTED,
      condition: 'no_contact_90_days',
      daysDelay: 90,
      action: 'notification'
    },
    {
      fromStatus: LeadStatus.IN_PROCESS,
      toStatus: LeadStatus.NOT_INTERESTED,
      condition: 'no_follow_up_30_days',
      daysDelay: 30,
      action: 'notification'
    }
  ];

  async processWorkflowAutomation(): Promise<void> {
    console.log('🔄 Processing Lead Workflow Automation...');

    try {
      // Process automatic status changes
      await this.processAutomaticStatusChanges();
      
      // Process notifications
      await this.processWorkflowNotifications();
      
      // Process overdue follow-ups
      await this.processOverdueFollowUps();
      
      console.log('✅ Lead workflow automation completed');
    } catch (error) {
      console.error('❌ Lead workflow automation error:', error);
    }
  }

  private async processAutomaticStatusChanges(): Promise<void> {
    console.log('📊 Processing automatic status changes...');

    // Auto-convert interested leads to converted when booking is created
    const interestedLeads = await this.leadRepository.find({
      where: { status: LeadStatus.INTERESTED },
      relations: ['convertedToCustomer']
    });

    for (const lead of interestedLeads) {
      if (lead.convertedToCustomerId) {
        await this.updateLeadStatus(lead.id, LeadStatus.CLOSE_WON, 'Booking created - auto-converted');
        console.log(`✅ Auto-converted lead: ${lead.fullName}`);
      }
    }

    // Auto-mark leads as lost based on time criteria (DISABLED - too aggressive)
    // This functionality has been disabled to prevent premature lead loss
    // Leads should only be marked as lost manually by sales agents/managers
    // after proper follow-up attempts and qualification
    
    console.log('⚠️ Auto-marking leads as lost has been disabled to prevent premature lead loss');
    console.log('📝 Leads should be manually marked as lost after proper follow-up attempts');
  }

  private async processWorkflowNotifications(): Promise<void> {
    console.log('🔔 Processing workflow notifications...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find leads with upcoming follow-ups
    const upcomingFollowUps = await this.leadRepository.find({
      where: {
        nextFollowUpAt: Between(now, tomorrow)
      },
      relations: ['assignedToUser']
    });

    for (const lead of upcomingFollowUps) {
      if (lead.assignedToUserId) {
        await this.createNotification(
          lead.assignedToUserId,
          NotificationType.GENERAL,
          NotificationPriority.MEDIUM,
          `Follow-up reminder: ${lead.fullName}`,
          `Lead ${lead.fullName} has a follow-up scheduled for tomorrow. Current status: ${lead.status}`,
          lead.id
        );
        console.log(`🔔 Created follow-up reminder for: ${lead.fullName}`);
      }
    }

    // Find overdue follow-ups
    const overdueFollowUps = await this.leadRepository.find({
      where: {
        nextFollowUpAt: LessThan(now),
        status: LeadStatus.IN_PROCESS
      },
      relations: ['assignedToUser']
    });

    for (const lead of overdueFollowUps) {
      if (lead.assignedToUserId) {
        await this.createNotification(
          lead.assignedToUserId,
          NotificationType.GENERAL,
          NotificationPriority.HIGH,
          `Overdue follow-up: ${lead.fullName}`,
          `Lead ${lead.fullName} has an overdue follow-up. Please contact immediately.`,
          lead.id
        );
        console.log(`⚠️ Created overdue reminder for: ${lead.fullName}`);
      }
    }
  }

  private async processOverdueFollowUps(): Promise<void> {
    console.log('⏰ Processing overdue follow-ups...');

    const now = new Date();
    const overdueLeads = await this.leadRepository.find({
      where: {
        nextFollowUpAt: LessThan(now),
        status: LeadStatus.IN_PROCESS
      }
    });

    for (const lead of overdueLeads) {
      // Update next follow-up to tomorrow to give another chance
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await this.leadRepository.update(lead.id, {
        nextFollowUpAt: tomorrow,
        updatedAt: now
      });
      console.log(`⏰ Updated follow-up date for overdue lead: ${lead.fullName}`);
    }
  }

  async updateLeadStatus(leadId: string, newStatus: LeadStatus, reason?: string): Promise<void> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) return;

    const oldStatus = lead.status;
    
    await this.leadRepository.update(leadId, {
      status: newStatus,
      updatedAt: new Date()
    });

    // Create notification for status change
    if (lead.assignedToUserId) {
      await this.createNotification(
        lead.assignedToUserId,
        NotificationType.GENERAL,
        NotificationPriority.MEDIUM,
        `Lead status updated: ${lead.fullName}`,
        `Lead ${lead.fullName} status changed from ${oldStatus} to ${newStatus}. ${reason || ''}`,
        leadId
      );
    }

    console.log(`📝 Status updated: ${lead.fullName} ${oldStatus} → ${newStatus}`);
  }

  async scheduleFollowUp(leadId: string, followUpDate: Date, notes?: string): Promise<void> {
    await this.leadRepository.update(leadId, {
      nextFollowUpAt: followUpDate,
      updatedAt: new Date()
    });

    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (lead && lead.assignedToUserId) {
      await this.createNotification(
        lead.assignedToUserId,
        NotificationType.GENERAL,
        NotificationPriority.MEDIUM,
        `Follow-up scheduled: ${lead.fullName}`,
        `Follow-up scheduled for ${followUpDate.toDateString()}. ${notes || ''}`,
        leadId
      );
    }

    console.log(`📅 Follow-up scheduled: ${lead?.fullName} for ${followUpDate.toDateString()}`);
  }

  private async createNotification(
    recipientId: string,
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    message: string,
    leadId?: string
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      recipientId,
      type,
      priority,
      title,
      message,
      scheduledFor: new Date(),
      status: NotificationStatus.UNREAD
    });

    await this.notificationRepository.save(notification);
  }

  async getWorkflowStats(): Promise<any> {
    const stats = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.status')
      .getRawMany();

    const workflowStats = {
      totalLeads: 0,
      byStatus: {},
      conversions: 0,
      lost: 0
    };

    stats.forEach(stat => {
      workflowStats.totalLeads += parseInt(stat.count);
      workflowStats.byStatus[stat.status] = parseInt(stat.count);
      
      if (stat.status === LeadStatus.CLOSE_WON) {
        workflowStats.conversions = parseInt(stat.count);
      }
      if (stat.status === LeadStatus.NOT_INTERESTED) {
        workflowStats.lost = parseInt(stat.count);
      }
    });

    return workflowStats;
  }
}
