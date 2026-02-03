import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installment } from './installment.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { Payment } from './payment.entity';
import { PaymentPlan } from './payment-plan.entity';
import { PaymentProof } from './payment-proof.entity';
import { Expense } from './expense.entity';
import { Account, JournalEntry, JournalLine } from './entities';
import { FinanceController } from './finance.controller';
import { PaymentScheduleController } from './payment-schedule.controller';
import { PaymentController } from './payment.controller';
import { PaymentPlanController } from './payment-plan.controller';
import { BookingPaymentController } from './booking-payment.controller';
import { ExpenseController } from './expense.controller';
import { FinanceService } from './finance.service';
import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentService } from './payment.service';
import { PaymentPlanService } from './payment-plan.service';
import { BookingPaymentService } from './booking-payment.service';
import { EnhancedPaymentScheduleService } from './enhanced-payment-schedule.service';
import { ExpenseService } from './expense.service';
import { Booking } from '../bookings/booking.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
    Installment, 
    PaymentSchedule, 
    Payment, 
    PaymentPlan, 
    PaymentProof, 
    Expense,
    Booking,
    Account, 
    JournalEntry, 
    JournalLine
  ]),
    AuditModule,
  ],
  providers: [
    FinanceService, 
    PaymentScheduleService, 
    PaymentService, 
    PaymentPlanService, 
    BookingPaymentService,
    EnhancedPaymentScheduleService,
    ExpenseService
  ],
  controllers: [
    FinanceController, 
    PaymentScheduleController, 
    PaymentController, 
    PaymentPlanController, 
    BookingPaymentController,
    ExpenseController
  ],
  exports: [
    FinanceService, 
    PaymentScheduleService, 
    PaymentService, 
    PaymentPlanService, 
    BookingPaymentService,
    EnhancedPaymentScheduleService,
    ExpenseService
  ],
})
export class FinanceModule {} 