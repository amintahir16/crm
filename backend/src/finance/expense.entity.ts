import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ExpenseCategory {
  ADMINISTRATIVE = 'administrative',
  MAINTENANCE = 'maintenance',
  UTILITIES = 'utilities',
  SECURITY = 'security',
  LANDSCAPING = 'landscaping',
  CONSTRUCTION = 'construction',
  LEGAL = 'legal',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  TAXES = 'taxes',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  expenseName: string;

  @Column({
    type: 'varchar',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'varchar',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING,
  })
  status: ExpenseStatus;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  vendorContact: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  receiptNumber: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ nullable: true })
  accountId: string; // Link to chart of accounts

  @Column({ nullable: true })
  submittedBy: string;

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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submittedBy' })
  submittedByUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser: User;
}

