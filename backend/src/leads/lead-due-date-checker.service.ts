import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, LessThan } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';
import { CrmNotificationService } from './crm-notification.service';
// Note: Uncomment when @nestjs/schedule is installed
// import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LeadDueDateCheckerService {
  private readonly logger = new Logger(LeadDueDateCheckerService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: CrmNotificationService,
  ) {}

  /**
   * Check for leads with due dates and send notifications
   * Runs daily at 9 AM (when ScheduleModule is enabled)
   * Can also be called manually via endpoint
   */
  // @Cron(CronExpression.EVERY_DAY_AT_9AM) // Uncomment when @nestjs/schedule is installed
  async checkDueDates() {
    this.logger.log('Checking lead due dates...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find leads due today
    const leadsDueToday = await this.leadRepository.find({
      where: {
        dueDate: MoreThanOrEqual(today),
      },
      relations: ['assignedToUser'],
    });

    // Filter to only today's date
    const todayLeads = leadsDueToday.filter(lead => {
      if (!lead.dueDate) return false;
      const leadDate = new Date(lead.dueDate);
      leadDate.setHours(0, 0, 0, 0);
      return leadDate.getTime() === today.getTime();
    });

    // Find leads past due date
    const leadsPastDue = await this.leadRepository.find({
      where: {
        dueDate: LessThan(today),
      },
      relations: ['assignedToUser'],
    });

    // Send notifications for leads due today
    for (const lead of todayLeads) {
      if (lead.assignedToUser) {
        await this.notificationService.notifyLeadDueToday(lead, lead.assignedToUser);
        
        // Also notify manager if assigned user has a manager
        if (lead.assignedToUser.assignedToUserId) {
          const manager = await this.userRepository.findOne({
            where: { id: lead.assignedToUser.assignedToUserId },
          });
          if (manager) {
            await this.notificationService.notifyLeadDueToday(lead, manager);
          }
        }
      }
    }

    // Send notifications for leads past due
    for (const lead of leadsPastDue) {
      if (lead.assignedToUser) {
        await this.notificationService.notifyLeadDuePassed(lead, lead.assignedToUser);
        
        // Also notify manager
        if (lead.assignedToUser.assignedToUserId) {
          const manager = await this.userRepository.findOne({
            where: { id: lead.assignedToUser.assignedToUserId },
          });
          if (manager) {
            await this.notificationService.notifyLeadDuePassed(lead, manager);
          }
        }
      }
    }

    this.logger.log(`Checked ${todayLeads.length} leads due today and ${leadsPastDue.length} leads past due`);
  }

  /**
   * Manual trigger for testing
   */
  async checkDueDatesNow() {
    await this.checkDueDates();
  }
}

