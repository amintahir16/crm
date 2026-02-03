import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { Installment } from './installment.entity';
import { Payment } from './payment.entity';
import { PaymentPlan } from './payment-plan.entity';

export enum PaymentType {
  FULL_PAYMENT = 'full_payment',
  INSTALLMENT = 'installment',
}

export enum PaymentScheduleStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column({ nullable: true })
  paymentPlanId: string;

  @Column({
    type: 'varchar',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column({
    type: 'varchar',
    enum: PaymentScheduleStatus,
    default: PaymentScheduleStatus.ACTIVE,
  })
  status: PaymentScheduleStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  downPayment: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  pendingAmount: number;

  @Column({ nullable: true })
  installmentCount: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  installmentAmount: number;

  @Column({ nullable: true })
  installmentFrequency: string; // 'monthly', 'quarterly', etc.

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  lateFeeRate: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalLateFees: number;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Booking, booking => booking.paymentSchedules)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @OneToMany(() => Installment, installment => installment.paymentSchedule)
  installments: Installment[];

  @OneToMany(() => Payment, payment => payment.paymentSchedule)
  payments: Payment[];

  @ManyToOne(() => PaymentPlan, paymentPlan => paymentPlan.paymentSchedules)
  @JoinColumn({ name: 'paymentPlanId' })
  paymentPlan: PaymentPlan;
}
