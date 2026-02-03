import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { SalesManagerDashboardController } from './sales-manager-dashboard.controller';
import { SalesManagerDashboardService } from './sales-manager-dashboard.service';
import { Plot } from '../plots/plot.entity';
import { Customer } from '../customers/customer.entity';
import { Booking } from '../bookings/booking.entity';
import { Installment } from '../finance/installment.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { Document } from '../documents/document.entity';
import { Message } from '../communication/message.entity';
import { Lead } from '../leads/lead.entity';
import { Payment } from '../finance/payment.entity';
import { SalesActivity } from '../users/sales-activity.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plot, 
      Customer, 
      Booking, 
      Installment, 
      ConstructionProject, 
      Document, 
      Message,
      Lead,
      Payment,
      SalesActivity
    ]),
    UsersModule,
  ],
  providers: [SalesManagerDashboardService],
  controllers: [DashboardController, SalesManagerDashboardController],
  exports: [SalesManagerDashboardService],
})
export class DashboardModule {} 