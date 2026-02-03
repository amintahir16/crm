import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PaymentSchedule } from './payment-schedule.entity';
import { User } from '../users/user.entity';
import { PaymentProof } from './payment-proof.entity';

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  MOBILE_WALLET = 'mobile_wallet',
  ONLINE_BANKING = 'online_banking',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentScheduleId: string;

  @Column()
  amount: number;

  @Column({
    type: 'varchar',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'varchar',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  chequeNumber: string;

  @Column({ type: 'date', nullable: true })
  chequeDate: Date;

  @Column({ nullable: true })
  cardLastFour: string;

  @Column({ nullable: true })
  walletProvider: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  receiptNumber: string;

  @Column({ type: 'date', nullable: true })
  paymentDate: Date;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PaymentSchedule, paymentSchedule => paymentSchedule.payments)
  @JoinColumn({ name: 'paymentScheduleId' })
  paymentSchedule: PaymentSchedule;

  @ManyToOne(() => User, user => user.processedPayments)
  @JoinColumn({ name: 'processedBy' })
  processedByUser: User;

  @ManyToOne(() => User, user => user.approvedPayments)
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser: User;

  @OneToMany(() => PaymentProof, paymentProof => paymentProof.payment)
  paymentProofs: PaymentProof[];
}
