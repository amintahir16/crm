import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './lead.entity';
import { LeadCommunication } from './lead-communication.entity';
import { LeadNote } from './lead-note.entity';
import { LeadStatus } from './lead-status.entity';
import { LeadActivityLog } from './lead-activity-log.entity';
import { CrmNotification } from './crm-notification.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadAutomationService } from './lead-automation.service';
import { LeadWebhooksController } from './webhooks/lead-webhooks.controller';
import { LeadsImportController } from './leads-import.controller';
import { LeadsImportService } from './leads-import.service';
import { LeadWorkflowService } from './lead-workflow.service';
import { LeadActivityService } from './lead-activity.service';
import { CrmNotificationService } from './crm-notification.service';
import { LeadDueDateCheckerService } from './lead-due-date-checker.service';
import { Customer } from '../customers/customer.entity';
import { SalesActivity } from '../users/sales-activity.entity';
import { Notification } from '../communication/notification.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      LeadCommunication,
      LeadNote,
      LeadStatus,
      LeadActivityLog,
      CrmNotification,
      Customer,
      SalesActivity,
      Notification,
      User,
    ]),
    UsersModule,
  ],
  controllers: [LeadsController, LeadWebhooksController, LeadsImportController],
  providers: [
    LeadsService,
    LeadAutomationService,
    LeadsImportService,
    LeadWorkflowService,
    LeadActivityService,
    CrmNotificationService,
    LeadDueDateCheckerService,
  ],
  exports: [
    LeadsService,
    LeadAutomationService,
    LeadsImportService,
    LeadWorkflowService,
    LeadActivityService,
    CrmNotificationService,
    LeadDueDateCheckerService,
  ],
})
export class LeadsModule {}
