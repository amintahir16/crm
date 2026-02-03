import { Module } from '@nestjs/common';
import { WorkflowSchedulerService } from './workflow-scheduler.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    LeadsModule,
  ],
  providers: [WorkflowSchedulerService],
})
export class TasksModule {}
