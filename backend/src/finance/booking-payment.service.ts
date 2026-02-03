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
  ) {}

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

    // Update booking payment amounts
    booking.paidAmount = (booking.paidAmount || 0) + addPaymentDto.amount;
    booking.pendingAmount = booking.totalAmount - booking.paidAmount;
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
  }> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payments = await this.getBookingPayments(bookingId);

    return {
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount || 0,
      pendingAmount: booking.pendingAmount || booking.totalAmount,
      paymentCount: payments.length,
      lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null,
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
