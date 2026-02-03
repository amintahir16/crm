import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LeadWorkflowService } from '../leads/lead-workflow.service';

@Injectable()
export class WorkflowSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowSchedulerService.name);
  private hourlyInterval: NodeJS.Timeout | null = null;
  private dailyInterval: NodeJS.Timeout | null = null;

  constructor(private leadWorkflowService: LeadWorkflowService) {}

  onModuleInit() {
    this.logger.log('🔄 Starting workflow scheduler...');
    this.startHourlyWorkflow();
    this.startDailyReport();
  }

  private startHourlyWorkflow() {
    // Run every hour (3600000 ms)
    this.hourlyInterval = setInterval(async () => {
      this.logger.log('🔄 Starting scheduled lead workflow automation...');
      
      try {
        await this.leadWorkflowService.processWorkflowAutomation();
        this.logger.log('✅ Lead workflow automation completed successfully');
      } catch (error) {
        this.logger.error('❌ Lead workflow automation failed:', error);
      }
    }, 3600000); // 1 hour

    this.logger.log('✅ Hourly workflow scheduler started');
  }

  private startDailyReport() {
    // Calculate time until next 9 AM
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    if (next9AM <= now) {
      next9AM.setDate(next9AM.getDate() + 1);
    }

    const timeUntil9AM = next9AM.getTime() - now.getTime();

    // Set initial timeout for next 9 AM
    setTimeout(() => {
      this.runDailyReport();
      
      // Then run every 24 hours
      this.dailyInterval = setInterval(() => {
        this.runDailyReport();
      }, 86400000); // 24 hours
    }, timeUntil9AM);

    this.logger.log(`✅ Daily report scheduler started (next run at ${next9AM.toISOString()})`);
  }

  private async runDailyReport() {
    this.logger.log('📊 Generating daily workflow report...');
    
    try {
      const stats = await this.leadWorkflowService.getWorkflowStats();
      this.logger.log('Daily Workflow Stats:', stats);
    } catch (error) {
      this.logger.error('❌ Daily workflow report failed:', error);
    }
  }

  onModuleDestroy() {
    if (this.hourlyInterval) {
      clearInterval(this.hourlyInterval);
    }
    if (this.dailyInterval) {
      clearInterval(this.dailyInterval);
    }
    this.logger.log('🛑 Workflow scheduler stopped');
  }
}
