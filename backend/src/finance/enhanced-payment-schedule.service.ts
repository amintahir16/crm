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
    discountPercentage?: number,
  ): Promise<PaymentSchedule> {
    const discount = Number(discountPercentage) || 0;
    const discountFactor = discount > 0 ? (1 - discount / 100) : 1;

    // Apply discount to the down payment requirement
    const originalDownPayment = await this.paymentPlanService.calculateDownPayment(paymentPlan);
    const requiredDownPayment = Math.round(originalDownPayment * discountFactor);
    const downPaymentPaid = actualDownPaymentPaid || 0;

    // CRITICAL: Use booking.totalAmount (already discounted from frontend)
    const bookingTotalAmount = Number(booking.totalAmount);

    // Apply discount to the installment amount for the schedule
    const discountedMonthlyPayment = Math.round(paymentPlan.monthlyPayment * discountFactor);

    const paymentSchedule = this.paymentScheduleRepository.create({
      bookingId: booking.id,
      paymentPlanId: paymentPlan.id,
      paymentType: PaymentType.INSTALLMENT,
      totalAmount: bookingTotalAmount,
      downPayment: requiredDownPayment,
      paidAmount: 0, // Will be updated via recordPayment when initial payment is processed
      pendingAmount: bookingTotalAmount, // Will be updated via recordPayment
      installmentCount: paymentPlan.tenureMonths,
      installmentAmount: discountedMonthlyPayment,
      installmentFrequency: 'monthly',
      startDate: startDate || new Date(),
      status: PaymentScheduleStatus.ACTIVE,
    });

    // Calculate end date
    const endDate = new Date(paymentSchedule.startDate);
    endDate.setMonth(endDate.getMonth() + paymentPlan.tenureMonths);
    paymentSchedule.endDate = endDate;

    const savedSchedule = await this.paymentScheduleRepository.save(paymentSchedule);

    // Create installments based on payment plan (with discount applied)
    await this.createInstallmentsFromPlan(savedSchedule, paymentPlan, requiredDownPayment, downPaymentPaid, discountFactor);

    return savedSchedule;
  }

  private async createInstallmentsFromPlan(
    paymentSchedule: PaymentSchedule,
    paymentPlan: PaymentPlan,
    requiredDownPayment: number,
    downPaymentPaid: number,
    discountFactor: number = 1,
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

    // 2. Create monthly installments ONLY if monthlyPayment > 0
    //    When an alternative frequency is primary (quarterly/bi-yearly/triannual),
    //    monthlyPayment will be 0 and monthly installments are skipped.
    const monthlyStartMonth = remainingDownPayment > 0 ? 2 : 1;
    const discountedMonthly = Math.round(paymentPlan.monthlyPayment * discountFactor);
    if (discountedMonthly > 0) {
      for (let i = 0; i < paymentPlan.tenureMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: discountedMonthly,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'monthly',
            description: `Monthly Installment ${i + 1}`,
          }),
        );
      }
    }

    // 3. Add quarterly installments if configured (with discount applied)
    if (paymentPlan.quarterlyPayment && paymentPlan.quarterlyPayment > 0) {
      const discountedQuarterly = Math.round(paymentPlan.quarterlyPayment * discountFactor);
      const isPrimary = discountedMonthly <= 0;
      let qIdx = 1;
      for (let i = 3; i <= paymentPlan.tenureMonths; i += 3) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: discountedQuarterly,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'quarterly',
            description: isPrimary
              ? `Quarterly Installment ${qIdx++}`
              : `Quarterly Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // 4. Add bi-yearly installments if configured (with discount applied)
    if (paymentPlan.biYearlyPayment && paymentPlan.biYearlyPayment > 0) {
      const discountedBiYearly = Math.round(paymentPlan.biYearlyPayment * discountFactor);
      const isPrimary = discountedMonthly <= 0;
      let bIdx = 1;
      for (let i = 6; i <= paymentPlan.tenureMonths; i += 6) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: discountedBiYearly,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'bi_yearly',
            description: isPrimary
              ? `Bi-Yearly Installment ${bIdx++}`
              : `Bi-Yearly Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // 5. Add triannual installments if configured (with discount applied)
    if (paymentPlan.triannualPayment && paymentPlan.triannualPayment > 0) {
      const discountedTriannual = Math.round(paymentPlan.triannualPayment * discountFactor);
      const isPrimary = discountedMonthly <= 0;
      let tIdx = 1;
      for (let i = 4; i <= paymentPlan.tenureMonths; i += 4) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthlyStartMonth + i - 1);

        installments.push(
          this.installmentRepository.create({
            bookingId: paymentSchedule.bookingId,
            paymentScheduleId: paymentSchedule.id,
            amount: discountedTriannual,
            dueDate,
            status: InstallmentStatus.PENDING,
            lateFee: 0,
            installmentType: 'triannual',
            description: isPrimary
              ? `Triannual Installment ${tIdx++}`
              : `Triannual Payment (Month ${monthlyStartMonth + i - 1})`,
          }),
        );
      }
    }

    // Sort installments by due date before saving
    installments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    await this.installmentRepository.save(installments);
  }
}
