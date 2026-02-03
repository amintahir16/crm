import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSchedule, PaymentType, PaymentScheduleStatus } from './payment-schedule.entity';
import { Installment, InstallmentStatus } from './installment.entity';
import { Booking } from '../bookings/booking.entity';
import { PaymentPlan } from './payment-plan.entity';
import { PaymentPlanService } from './payment-plan.service';
import { PaymentScheduleService } from './payment-schedule.service';

@Injectable()
export class EnhancedPaymentScheduleService extends PaymentScheduleService {
  constructor(
    @InjectRepository(PaymentSchedule)
    paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(Installment)
    installmentRepository: Repository<Installment>,
    private paymentPlanService: PaymentPlanService,
  ) {
    super(paymentScheduleRepository, installmentRepository);
  }

  async createPaymentScheduleFromPlan(
    booking: Booking,
    paymentPlan: PaymentPlan,
    actualDownPaymentPaid?: number,
    startDate?: Date,
  ): Promise<PaymentSchedule> {
    const requiredDownPayment = await this.paymentPlanService.calculateDownPayment(paymentPlan);
    const downPaymentPaid = actualDownPaymentPaid || 0;
    
    const paymentSchedule = this.paymentScheduleRepository.create({
      bookingId: booking.id,
      paymentPlanId: paymentPlan.id,
      paymentType: PaymentType.INSTALLMENT,
      totalAmount: paymentPlan.plotPrice,
      downPayment: requiredDownPayment,
      paidAmount: downPaymentPaid,
      pendingAmount: paymentPlan.plotPrice - downPaymentPaid,
      installmentCount: paymentPlan.tenureMonths,
      installmentAmount: paymentPlan.monthlyPayment,
      installmentFrequency: 'monthly',
      startDate: startDate || new Date(),
      status: PaymentScheduleStatus.ACTIVE,
    });

    // Calculate end date
    const endDate = new Date(paymentSchedule.startDate);
    endDate.setMonth(endDate.getMonth() + paymentPlan.tenureMonths);
    paymentSchedule.endDate = endDate;

    const savedSchedule = await this.paymentScheduleRepository.save(paymentSchedule);

    // Create installments based on payment plan
    await this.createInstallmentsFromPlan(savedSchedule, paymentPlan, requiredDownPayment, downPaymentPaid);

    return savedSchedule;
  }

  private async createInstallmentsFromPlan(
    paymentSchedule: PaymentSchedule,
    paymentPlan: PaymentPlan,
    requiredDownPayment: number,
    downPaymentPaid: number,
  ): Promise<void> {
    const installments = [];
    const startDate = new Date(paymentSchedule.startDate);

    // 1. Add remaining down payment installment if not paid in full
    const remainingDownPayment = requiredDownPayment - downPaymentPaid;
    if (remainingDownPayment > 0) {
      const downPaymentDueDate = new Date(startDate);
      downPaymentDueDate.setMonth(downPaymentDueDate.getMonth() + 1); // Due after 1 month

      installments.push(
        this.installmentRepository.create({
          bookingId: paymentSchedule.bookingId,
          paymentScheduleId: paymentSchedule.id,
          amount: remainingDownPayment,
          dueDate: downPaymentDueDate,
          status: InstallmentStatus.PENDING,
          lateFee: 0,
          installmentType: 'down_payment_balance',
          description: 'Remaining Down Payment',
        }),
      );
    }

    // 2. Create monthly installments (starting from month 1 or 2 depending on down payment)
    const monthlyStartMonth = remainingDownPayment > 0 ? 2 : 1; // Start from month 2 if down payment balance exists
    for (let i = 0; i < paymentPlan.tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i);

      installments.push(
        this.installmentRepository.create({
          bookingId: paymentSchedule.bookingId,
          paymentScheduleId: paymentSchedule.id,
          amount: paymentPlan.monthlyPayment,
          dueDate,
          status: InstallmentStatus.PENDING,
          lateFee: 0,
          installmentType: 'monthly',
          description: `Monthly Installment ${i + 1}`,
        }),
      );
    }

    // 3. Add quarterly installments if configured (every 3 months)
    if (paymentPlan.quarterlyPayment && paymentPlan.quarterlyPayment > 0) {
      for (let i = 3; i <= paymentPlan.tenureMonths; i += 3) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: paymentPlan.quarterlyPayment,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'quarterly',
            description: `Quarterly Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // 4. Add bi-yearly installments if configured (every 6 months)
    if (paymentPlan.biYearlyPayment && paymentPlan.biYearlyPayment > 0) {
      for (let i = 6; i <= paymentPlan.tenureMonths; i += 6) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: paymentPlan.biYearlyPayment,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'bi_yearly',
            description: `Bi-Yearly Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // 5. Add triannual installments if configured (every 4 months = 3 times per year)
    if (paymentPlan.triannualPayment && paymentPlan.triannualPayment > 0) {
      for (let i = 4; i <= paymentPlan.tenureMonths; i += 4) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: paymentPlan.triannualPayment,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'triannual',
            description: `Triannual Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // Sort installments by due date before saving
    installments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    await this.installmentRepository.save(installments);
  }
}
