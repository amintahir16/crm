import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSchedule, PaymentType, PaymentScheduleStatus } from './payment-schedule.entity';
import { Installment, InstallmentStatus } from './installment.entity';
import { Booking } from '../bookings/booking.entity';

@Injectable()
export class PaymentScheduleService {
  constructor(
    @InjectRepository(PaymentSchedule)
    protected paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(Installment)
    protected installmentRepository: Repository<Installment>,
  ) { }

  async createPaymentSchedule(
    booking: Booking,
    paymentType: PaymentType,
    totalAmount: number,
    downPayment: number,
    installmentCount?: number,
    startDate?: Date,
  ): Promise<PaymentSchedule> {
    const paymentSchedule = this.paymentScheduleRepository.create({
      bookingId: booking.id,
      paymentType,
      totalAmount,
      downPayment,
      paidAmount: 0,
      pendingAmount: totalAmount,
      status: PaymentScheduleStatus.ACTIVE,
    });

    if (paymentType === PaymentType.INSTALLMENT && installmentCount) {
      const installmentAmount = (totalAmount - downPayment) / installmentCount;
      paymentSchedule.installmentCount = installmentCount;
      paymentSchedule.installmentAmount = installmentAmount;
      paymentSchedule.installmentFrequency = 'monthly';
      paymentSchedule.startDate = startDate || new Date();

      // Calculate end date (24 months from start)
      const endDate = new Date(paymentSchedule.startDate);
      endDate.setMonth(endDate.getMonth() + installmentCount);
      paymentSchedule.endDate = endDate;
    }

    const savedSchedule = await this.paymentScheduleRepository.save(paymentSchedule);

    // Create installments if it's an installment plan
    if (paymentType === PaymentType.INSTALLMENT && installmentCount) {
      await this.createInstallments(savedSchedule, installmentCount, paymentSchedule.installmentAmount);
    }

    return savedSchedule;
  }

  private async createInstallments(
    paymentSchedule: PaymentSchedule,
    installmentCount: number,
    installmentAmount: number,
  ): Promise<void> {
    const installments = [];
    const startDate = new Date(paymentSchedule.startDate);

    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      installments.push(
        this.installmentRepository.create({
          bookingId: paymentSchedule.bookingId,
          paymentScheduleId: paymentSchedule.id,
          amount: installmentAmount,
          dueDate,
          status: InstallmentStatus.PENDING,
          lateFee: 0,
        }),
      );
    }

    await this.installmentRepository.save(installments);
  }

  async recordPayment(
    paymentScheduleId: string,
    amount: number,
    installmentIds?: string[],
    isInitialPayment: boolean = false,
  ): Promise<PaymentSchedule> {
    const paymentSchedule = await this.paymentScheduleRepository.findOne({
      where: { id: paymentScheduleId },
      relations: ['installments'],
    });

    if (!paymentSchedule) {
      throw new Error('Payment schedule not found');
    }

    // Update paid amount
    paymentSchedule.paidAmount = Number(paymentSchedule.paidAmount) + amount;
    paymentSchedule.pendingAmount = Number(paymentSchedule.totalAmount) - paymentSchedule.paidAmount;

    // Mark installments as paid
    if (installmentIds && installmentIds.length > 0) {
      // Mark specific installments
      for (const installmentId of installmentIds) {
        await this.installmentRepository.update(
          { id: installmentId },
          {
            status: InstallmentStatus.PAID,
            paidDate: new Date(),
          },
        );
      }
    } else if (!isInitialPayment) {
      // Auto-mark installments as paid based on payment amount
      // ONLY for manual payments (not the initial down payment)
      // Initial down payment should NOT mark monthly installments
      console.log(`[recordPayment] Schedule ${paymentScheduleId}: amount=${amount}, installments loaded=${paymentSchedule.installments?.length || 0}`);

      if (paymentSchedule.installments && paymentSchedule.installments.length > 0) {
        // Sort by priority: down_payment_balance first, then by due date
        const pendingInstallments = paymentSchedule.installments
          .filter(inst => inst.status === InstallmentStatus.PENDING || inst.status === InstallmentStatus.OVERDUE)
          .sort((a, b) => {
            // Down payment balance always comes first
            if (a.installmentType === 'down_payment_balance' && b.installmentType !== 'down_payment_balance') return -1;
            if (b.installmentType === 'down_payment_balance' && a.installmentType !== 'down_payment_balance') return 1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });

        console.log(`[recordPayment] Pending installments found: ${pendingInstallments.length}, first status: ${pendingInstallments[0]?.status}, first amount: ${pendingInstallments[0]?.amount}`);

        let remainingAmount = amount;
        for (const installment of pendingInstallments) {
          if (remainingAmount <= 0) break;

          const installmentAmount = Number(installment.amount);
          console.log(`[recordPayment] Checking installment ${installment.id}: type=${installment.installmentType}, amount=${installmentAmount}, remaining=${remainingAmount}, status=${installment.status}`);

          if (remainingAmount >= installmentAmount) {
            // Fully pay this installment
            await this.installmentRepository.update(
              { id: installment.id },
              {
                status: InstallmentStatus.PAID,
                paidDate: new Date(),
              },
            );
            console.log(`[recordPayment] ✅ Marked installment ${installment.id} as PAID`);
            remainingAmount -= installmentAmount;
          }
          // Skip partial payments — don't mark as paid unless fully covered
        }
      } else {
        console.log(`[recordPayment] ⚠️ No installments loaded for schedule ${paymentScheduleId}`);
      }
    } else {
      // Initial payment: only mark down_payment_balance installments if they exist
      if (paymentSchedule.installments && paymentSchedule.installments.length > 0) {
        const downPaymentInstallments = paymentSchedule.installments
          .filter(inst => inst.installmentType === 'down_payment_balance' &&
            (inst.status === InstallmentStatus.PENDING || inst.status === InstallmentStatus.OVERDUE));

        let remainingAmount = amount;
        for (const installment of downPaymentInstallments) {
          if (remainingAmount <= 0) break;
          const installmentAmount = Number(installment.amount);
          if (remainingAmount >= installmentAmount) {
            await this.installmentRepository.update(
              { id: installment.id },
              { status: InstallmentStatus.PAID, paidDate: new Date() },
            );
            console.log(`[recordPayment] ✅ Initial payment: marked down_payment_balance installment as PAID`);
            remainingAmount -= installmentAmount;
          }
        }
      }
    }

    // Check if payment schedule is completed
    if (paymentSchedule.pendingAmount <= 0) {
      paymentSchedule.status = PaymentScheduleStatus.COMPLETED;
    }

    return await this.paymentScheduleRepository.save(paymentSchedule);
  }

  async getPaymentScheduleByBooking(bookingId: string): Promise<PaymentSchedule[]> {
    return await this.paymentScheduleRepository.find({
      where: { bookingId },
      relations: ['installments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBookingId(bookingId: string): Promise<PaymentSchedule | null> {
    return await this.paymentScheduleRepository.findOne({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateInstallmentStatus(
    installmentId: string,
    status: InstallmentStatus,
    paidDate?: Date,
    lateFee?: number,
  ): Promise<Installment> {
    const installment = await this.installmentRepository.findOne({
      where: { id: installmentId },
    });

    if (!installment) {
      throw new Error('Installment not found');
    }

    installment.status = status;
    if (paidDate) installment.paidDate = paidDate;
    if (lateFee) installment.lateFee = lateFee;

    return await this.installmentRepository.save(installment);
  }

  async calculateLateFees(paymentScheduleId: string): Promise<number> {
    const overdueInstallments = await this.installmentRepository.find({
      where: {
        paymentScheduleId,
        status: InstallmentStatus.OVERDUE,
      },
    });

    let totalLateFees = 0;
    const currentDate = new Date();

    for (const installment of overdueInstallments) {
      const daysOverdue = Math.floor(
        (currentDate.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Calculate late fee (example: 2% per month)
      const monthlyLateFee = installment.amount * 0.02;
      const lateFee = (monthlyLateFee / 30) * daysOverdue;

      installment.lateFee = lateFee;
      totalLateFees += lateFee;
    }

    if (overdueInstallments.length > 0) {
      await this.installmentRepository.save(overdueInstallments);
    }

    return totalLateFees;
  }
}
