import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { PaymentSchedule } from './payment-schedule.entity';
import { PaymentProof, PaymentProofType } from './payment-proof.entity';
import { PaymentScheduleService } from './payment-schedule.service';

export interface AddPaymentDto {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date;
  transactionId?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date;
  notes?: string;
  processedBy: string;
}

export interface PaymentProofUploadDto {
  paymentId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  proofType: PaymentProofType;
  description?: string;
  uploadedBy: string;
}

@Injectable()
export class BookingPaymentService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(PaymentProof)
    private paymentProofRepository: Repository<PaymentProof>,
    private paymentScheduleService: PaymentScheduleService,
  ) { }

  async addManualPayment(addPaymentDto: AddPaymentDto): Promise<Payment> {
    const booking = await this.bookingRepository.findOne({
      where: { id: addPaymentDto.bookingId },
      relations: ['paymentSchedules'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Get the active payment schedule for this booking
    const paymentSchedule = await this.paymentScheduleRepository.findOne({
      where: { bookingId: booking.id },
      order: { createdAt: 'DESC' },
    });

    if (!paymentSchedule) {
      throw new NotFoundException('Payment schedule not found for this booking');
    }

    // Validate payment amount
    if (addPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (addPaymentDto.amount > paymentSchedule.pendingAmount) {
      throw new BadRequestException('Payment amount cannot exceed pending amount');
    }

    // Create the payment record
    const payment = this.paymentRepository.create({
      paymentScheduleId: paymentSchedule.id,
      amount: addPaymentDto.amount,
      paymentMethod: addPaymentDto.paymentMethod,
      status: PaymentStatus.COMPLETED,
      transactionId: addPaymentDto.transactionId,
      referenceNumber: addPaymentDto.referenceNumber,
      bankName: addPaymentDto.bankName,
      accountNumber: addPaymentDto.accountNumber,
      chequeNumber: addPaymentDto.chequeNumber,
      chequeDate: addPaymentDto.chequeDate,
      notes: addPaymentDto.notes,
      paymentDate: addPaymentDto.paymentDate || new Date(),
      processedBy: addPaymentDto.processedBy,
      approvedBy: addPaymentDto.processedBy, // Auto-approve manual payments
      approvedAt: new Date(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update booking payment amounts (use Number() to avoid floating-point precision issues)
    booking.paidAmount = Math.round((Number(booking.paidAmount) || 0) + Number(addPaymentDto.amount));
    booking.pendingAmount = Math.round(Number(booking.totalAmount) - booking.paidAmount);
    await this.bookingRepository.save(booking);

    // Update payment schedule
    await this.paymentScheduleService.recordPayment(
      paymentSchedule.id,
      addPaymentDto.amount,
    );

    return savedPayment;
  }

  async uploadPaymentProof(paymentProofDto: PaymentProofUploadDto): Promise<PaymentProof> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentProofDto.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const paymentProof = this.paymentProofRepository.create({
      paymentId: paymentProofDto.paymentId,
      fileName: paymentProofDto.fileName,
      filePath: paymentProofDto.filePath,
      fileSize: paymentProofDto.fileSize,
      mimeType: paymentProofDto.mimeType,
      proofType: paymentProofDto.proofType,
      description: paymentProofDto.description,
      uploadedBy: paymentProofDto.uploadedBy,
    });

    return await this.paymentProofRepository.save(paymentProof);
  }

  async getBookingPayments(bookingId: string): Promise<Payment[]> {
    const paymentSchedules = await this.paymentScheduleRepository.find({
      where: { bookingId },
    });

    if (!paymentSchedules.length) {
      return [];
    }

    const paymentScheduleIds = paymentSchedules.map(ps => ps.id);

    return await this.paymentRepository.find({
      where: { paymentScheduleId: paymentScheduleIds[0] }, // For now, get from first schedule
      relations: ['paymentProofs', 'processedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingPaymentSummary(bookingId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    paymentCount: number;
    lastPaymentDate: Date | null;
    overdueAmount: number;
    nextDueDate: Date | null;
    paymentProgress: number;
  }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payments = await this.getBookingPayments(bookingId);

    // Compute paid amount from actual completed payments
    const completedPayments = payments.filter(p => p.status === 'completed');
    const actualPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(booking.totalAmount);
    const actualPendingAmount = totalAmount - actualPaidAmount;

    // Sync booking if out of sync
    if (Math.abs(Number(booking.paidAmount) - actualPaidAmount) > 0.01) {
      booking.paidAmount = actualPaidAmount;
      booking.pendingAmount = actualPendingAmount;
      await this.bookingRepository.save(booking);
    }

    // Get overdue info from installments
    const paymentSchedule = await this.paymentScheduleRepository.findOne({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });

    let overdueAmount = 0;
    let nextDueDate: Date | null = null;

    if (paymentSchedule) {
      const { Installment, InstallmentStatus } = await import('./installment.entity');
      const installmentRepo = this.paymentScheduleRepository.manager.getRepository(Installment);

      // Get overdue installments
      const overdueInstallments = await installmentRepo.find({
        where: { paymentScheduleId: paymentSchedule.id, status: InstallmentStatus.OVERDUE },
      });
      overdueAmount = overdueInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);

      // Get next due installment
      const nextInstallment = await installmentRepo.findOne({
        where: { paymentScheduleId: paymentSchedule.id, status: InstallmentStatus.PENDING },
        order: { dueDate: 'ASC' },
      });
      nextDueDate = nextInstallment?.dueDate || null;
    }

    return {
      totalAmount,
      paidAmount: actualPaidAmount,
      pendingAmount: actualPendingAmount,
      paymentCount: completedPayments.length,
      lastPaymentDate: completedPayments.length > 0 ? completedPayments[0].paymentDate : null,
      overdueAmount,
      nextDueDate,
      paymentProgress: totalAmount > 0 ? Math.min(100, Math.round((actualPaidAmount / totalAmount) * 100)) : 0,
    };
  }

  async deletePaymentProof(proofId: string): Promise<void> {
    const paymentProof = await this.paymentProofRepository.findOne({
      where: { id: proofId },
    });

    if (!paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

    await this.paymentProofRepository.remove(paymentProof);
  }
}
