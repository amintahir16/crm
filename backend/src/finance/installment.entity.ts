import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { PaymentSchedule } from './payment-schedule.entity';

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('installments')
export class Installment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  paymentScheduleId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({
    type: 'varchar',
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING,
  })
  status: InstallmentStatus;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  lateFee: number;

  @Column({ nullable: true })
  installmentType: string; // 'monthly', 'quarterly', 'bi_yearly', 'triannual', 'down_payment_balance'

  @Column({ nullable: true })
  description: string; // Human-readable description

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Booking, booking => booking.installments)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => PaymentSchedule, paymentSchedule => paymentSchedule.installments)
  @JoinColumn({ name: 'paymentScheduleId' })
  paymentSchedule: PaymentSchedule;
} 