import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { SalesActivity } from './sales-activity.entity';
import { ActivityLog } from '../common/activity-log.entity';
import { Lead } from '../leads/lead.entity';
import { Booking } from '../bookings/booking.entity';
import { LeadActivityLog } from '../leads/lead-activity-log.entity';
import { UsersService } from './users.service';
import { SalesActivityService } from './sales-activity.service';
import { SalesTeamService } from './sales-team.service';
import { TeamActivityService } from './team-activity.service';
import { WorkloadUpdateService } from './workload-update.service';
import { LiveWorkloadService } from './live-workload.service';
import { UsersController } from './users.controller';
import { SalesActivityController } from './sales-activity.controller';
import { SalesTeamController } from './sales-team.controller';
import { TeamActivityController } from './team-activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, SalesActivity, ActivityLog, Lead, Booking, LeadActivityLog])],
  providers: [UsersService, SalesActivityService, SalesTeamService, TeamActivityService, WorkloadUpdateService, LiveWorkloadService],
  controllers: [UsersController, SalesActivityController, SalesTeamController, TeamActivityController],
  exports: [UsersService, SalesActivityService, SalesTeamService, TeamActivityService, WorkloadUpdateService, LiveWorkloadService, TypeOrmModule],
})
export class UsersModule {} 