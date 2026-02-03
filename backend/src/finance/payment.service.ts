import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { Installment, InstallmentStatus } from './installment.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntity, AuditSeverity } from '../audit/audit-log.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private auditService: AuditService,
  ) {}

  async createPayment(
    paymentScheduleId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    paymentData: Partial<Payment>,
    processedBy: string,
  ): Promise<Payment> {
    const payment = this.paymentRepository.create({
      paymentScheduleId,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING,
      processedBy,
      ...paymentData,
    });

    return await this.paymentRepository.save(payment);
  }

  async processPayment(
    paymentId: string,
    approvedBy: string,
    approved: boolean,
    rejectionReason?: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['paymentSchedule', 'paymentSchedule.installments'],
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (approved) {
      payment.status = PaymentStatus.COMPLETED;
      payment.approvedBy = approvedBy;
      payment.approvedAt = new Date();
      payment.paymentDate = new Date();

      // Update payment schedule
      const paymentSchedule = payment.paymentSchedule;
      paymentSchedule.paidAmount += payment.amount;
      paymentSchedule.pendingAmount = paymentSchedule.totalAmount - paymentSchedule.paidAmount;

      if (paymentSchedule.pendingAmount <= 0) {
        paymentSchedule.status = 'completed' as any;
      }

      await this.paymentScheduleRepository.save(paymentSchedule);

      // Update installments if this is an installment payment
      if (paymentSchedule.paymentType === 'installment') {
        await this.updateInstallmentsForPayment(paymentSchedule, payment.amount);
      }

      // Update booking paid amount and status
      await this.updateBookingPayment(paymentSchedule.bookingId, payment.amount);

      // Audit log
      await this.auditService.log(
        approvedBy,
        AuditAction.PAYMENT,
        AuditEntity.PAYMENT,
        `Payment approved: PKR ${payment.amount} for booking ${paymentSchedule.bookingId}`,
        {
          entityId: payment.id,
          newValues: { amount: payment.amount, status: payment.status },
          severity: AuditSeverity.HIGH,
          isSensitive: true,
        },
      );
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.rejectionReason = rejectionReason;

      // Audit log rejection
      await this.auditService.log(
        approvedBy,
        AuditAction.REJECT,
        AuditEntity.PAYMENT,
        `Payment rejected: PKR ${payment.amount} - ${rejectionReason}`,
        {
          entityId: payment.id,
          severity: AuditSeverity.MEDIUM,
        },
      );
    }

    return await this.paymentRepository.save(payment);
  }

  private async updateInstallmentsForPayment(
    paymentSchedule: PaymentSchedule,
    paymentAmount: number,
  ): Promise<void> {
    const pendingInstallments = await this.installmentRepository.find({
      where: {
        paymentScheduleId: paymentSchedule.id,
        status: InstallmentStatus.PENDING,
      },
      order: { dueDate: 'ASC' },
    });

    let remainingAmount = paymentAmount;

    for (const installment of pendingInstallments) {
      if (remainingAmount <= 0) break;

      if (remainingAmount >= installment.amount) {
        installment.status = InstallmentStatus.PAID;
        installment.paidDate = new Date();
        remainingAmount -= installment.amount;
      } else {
        // Partial payment - create a new installment for the remaining amount
        const newInstallment = this.installmentRepository.create({
          bookingId: installment.bookingId,
          paymentScheduleId: installment.paymentScheduleId,
          amount: installment.amount - remainingAmount,
          dueDate: installment.dueDate,
          status: InstallmentStatus.PENDING,
        });
        await this.installmentRepository.save(newInstallment);

        installment.amount = remainingAmount;
        installment.status = InstallmentStatus.PAID;
        installment.paidDate = new Date();
        remainingAmount = 0;
      }

      await this.installmentRepository.save(installment);
    }
  }

  async getAllPayments(options: {
    page: number;
    limit: number;
    status?: PaymentStatus;
    method?: PaymentMethod;
  }): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, status, method } = options;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.paymentSchedule', 'schedule')
        .leftJoinAndSelect('schedule.booking', 'booking')
        .leftJoinAndSelect('booking.customer', 'customer')
        .leftJoinAndSelect('booking.plot', 'plot')
        .leftJoinAndSelect('payment.processedByUser', 'processedBy')
        .leftJoinAndSelect('payment.approvedByUser', 'approvedBy')
        .orderBy('payment.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('payment.status = :status', { status });
      }

      if (method) {
        queryBuilder.andWhere('payment.paymentMethod = :method', { method });
      }

      const [payments, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        payments,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error in getAllPayments:', error);
      // Return empty result if there's an error
      return {
        payments: [],
        total: 0,
        page,
        limit,
      };
    }
  }

  async getPaymentsBySchedule(paymentScheduleId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { paymentScheduleId },
      relations: ['processedByUser', 'approvedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.paymentSchedule', 'schedule')
      .leftJoin('payment.processedByUser', 'processedBy')
      .leftJoin('payment.approvedByUser', 'approvedBy')
      .where('schedule.bookingId = :bookingId', { bookingId })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  async getPaymentSummary(bookingId: string): Promise<{
    totalPaid: number;
    totalPending: number;
    lastPaymentDate: Date | null;
    nextDueDate: Date | null;
    overdueAmount: number;
  }> {
    const payments = await this.getPaymentsByBooking(bookingId);
    const completedPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);

    const totalPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const lastPaymentDate = completedPayments.length > 0 
      ? completedPayments[0].paymentDate 
      : null;

    // Get payment schedule for pending amount
    const paymentSchedule = await this.paymentScheduleRepository.findOne({
      where: { bookingId },
      relations: ['installments'],
    });

    const totalPending = paymentSchedule ? paymentSchedule.pendingAmount : 0;

    // Get next due date from pending installments
    const nextInstallment = await this.installmentRepository.findOne({
      where: {
        paymentScheduleId: paymentSchedule?.id,
        status: InstallmentStatus.PENDING,
      },
      order: { dueDate: 'ASC' },
    });

    const nextDueDate = nextInstallment?.dueDate || null;

    // Calculate overdue amount
    const overdueInstallments = await this.installmentRepository.find({
      where: {
        paymentScheduleId: paymentSchedule?.id,
        status: InstallmentStatus.OVERDUE,
      },
    });

    const overdueAmount = overdueInstallments.reduce(
      (sum, installment) => sum + installment.amount,
      0,
    );

    return {
      totalPaid,
      totalPending,
      lastPaymentDate,
      nextDueDate,
      overdueAmount,
    };
  }

  async refundPayment(
    paymentId: string,
    refundAmount: number,
    reason: string,
    processedBy: string,
  ): Promise<Payment> {
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['paymentSchedule'],
    });

    if (!originalPayment) {
      throw new Error('Payment not found');
    }

    if (originalPayment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed payments');
    }

    // Create refund payment
    const refundPayment = this.paymentRepository.create({
      paymentScheduleId: originalPayment.paymentScheduleId,
      amount: -refundAmount, // Negative amount for refund
      paymentMethod: originalPayment.paymentMethod,
      status: PaymentStatus.REFUNDED,
      notes: `Refund for payment ${originalPayment.id}: ${reason}`,
      processedBy,
      paymentDate: new Date(),
    });

    const savedRefund = await this.paymentRepository.save(refundPayment);

    // Update payment schedule
    const paymentSchedule = originalPayment.paymentSchedule;
    paymentSchedule.paidAmount -= refundAmount;
    paymentSchedule.pendingAmount += refundAmount;

    await this.paymentScheduleRepository.save(paymentSchedule);

    return savedRefund;
  }

  async getPaymentAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalPayments: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    byStatus: Record<PaymentStatus, { count: number; amount: number }>;
    dailyPayments: Array<{ date: string; count: number; amount: number }>;
  }> {
    const query = this.paymentRepository.createQueryBuilder('payment');

    if (dateRange) {
      query.where('payment.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const payments = await query.getMany();
    const completedPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);

    const totalPayments = completedPayments.length;
    const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group by payment method
    const byMethod = {} as Record<PaymentMethod, { count: number; amount: number }>;
    Object.values(PaymentMethod).forEach(method => {
      const methodPayments = completedPayments.filter(p => p.paymentMethod === method);
      byMethod[method] = {
        count: methodPayments.length,
        amount: methodPayments.reduce((sum, p) => sum + p.amount, 0),
      };
    });

    // Group by status
    const byStatus = {} as Record<PaymentStatus, { count: number; amount: number }>;
    Object.values(PaymentStatus).forEach(status => {
      const statusPayments = payments.filter(p => p.status === status);
      byStatus[status] = {
        count: statusPayments.length,
        amount: statusPayments.reduce((sum, p) => sum + Math.abs(p.amount), 0),
      };
    });

    // Daily payments
    const dailyPayments = this.groupPaymentsByDay(completedPayments);

    return {
      totalPayments,
      totalAmount,
      byMethod,
      byStatus,
      dailyPayments,
    };
  }

  private async updateBookingPayment(bookingId: string, paymentAmount: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    
    if (!booking) {
      return;
    }

    // Update paid amount
    booking.paidAmount = (booking.paidAmount || 0) + paymentAmount;
    booking.pendingAmount = booking.totalAmount - booking.paidAmount;

    // Update booking status based on payment progress
    if (booking.pendingAmount <= 0) {
      booking.status = BookingStatus.COMPLETED;
    } else if (booking.paidAmount >= booking.downPayment && booking.status === BookingStatus.PENDING) {
      booking.status = BookingStatus.CONFIRMED;
    }

    await this.bookingRepository.save(booking);
  }

  private groupPaymentsByDay(payments: Payment[]): Array<{ date: string; count: number; amount: number }> {
    const grouped = payments.reduce((acc, payment) => {
      const date = payment.paymentDate?.toISOString().split('T')[0] || 
                   payment.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { count: 0, amount: 0 };
      }
      
      acc[date].count++;
      acc[date].amount += payment.amount;
      
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
