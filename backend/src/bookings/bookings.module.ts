import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { Customer } from '../customers/customer.entity';
import { Plot } from '../plots/plot.entity';
import { User } from '../users/user.entity';
import { PaymentSchedule } from '../finance/payment-schedule.entity';
import { Installment } from '../finance/installment.entity';
import { Payment } from '../finance/payment.entity';
import { PaymentScheduleService } from '../finance/payment-schedule.service';
import { EnhancedPaymentScheduleService } from '../finance/enhanced-payment-schedule.service';
import { PaymentPlanService } from '../finance/payment-plan.service';
import { PaymentPlan } from '../finance/payment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Customer, Plot, User, PaymentSchedule, Installment, Payment, PaymentPlan])],
  providers: [PaymentScheduleService, EnhancedPaymentScheduleService, PaymentPlanService],
  controllers: [BookingsController],
  exports: [],
})
export class BookingsModule {} 