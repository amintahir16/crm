import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { Plot } from '../plots/plot.entity';
import { Booking } from '../bookings/booking.entity';
import { Payment } from '../finance/payment.entity';
import { PaymentSchedule } from '../finance/payment-schedule.entity';
import { Installment } from '../finance/installment.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { Document } from '../documents/document.entity';
import { Notification } from '../communication/notification.entity';
import { Lead } from '../leads/lead.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Plot,
      Booking,
      Payment,
      PaymentSchedule,
      Installment,
      ConstructionProject,
      Document,
      Notification,
      Lead,
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
