import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConstructionProject } from './construction-project.entity';
import { User } from '../users/user.entity';

export enum ExpenseCategory {
  MATERIALS = 'materials',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  PERMITS = 'permits',
  INSPECTIONS = 'inspections',
  UTILITIES = 'utilities',
  TRANSPORTATION = 'transportation',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('construction_expenses')
export class ConstructionExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  expenseName: string;

  @Column({
    type: 'varchar',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column({
    type: 'varchar',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING,
  })
  status: ExpenseStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

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

  @ManyToOne(() => ConstructionProject)
  @JoinColumn({ name: 'projectId' })
  project: ConstructionProject;

  @ManyToOne(() => User, user => user.submittedExpenses)
  @JoinColumn({ name: 'submittedBy' })
  submittedByUser: User;

  @ManyToOne(() => User, user => user.approvedExpenses)
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser: User;
}
