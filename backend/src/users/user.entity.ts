import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { ActivityLog } from '../common/activity-log.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { Payment } from '../finance/payment.entity';
import { PaymentProof } from '../finance/payment-proof.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { ConstructionTask } from '../construction/construction-task.entity';
import { ConstructionExpense } from '../construction/construction-expense.entity';
import { ConstructionDocument } from '../construction/construction-document.entity';
import { Document } from '../documents/document.entity';
import { Notification } from '../communication/notification.entity';
import { Message } from '../communication/message.entity';

export enum UserRole {
  ADMIN = 'admin',
  SALES_MANAGER = 'sales_manager',
  SALES_PERSON = 'sales_person',
  ACCOUNTANT = 'accountant',
  INVESTOR = 'investor',
  BUYER = 'buyer',
  AUDITOR = 'auditor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // Sales team management fields
  @Column({ nullable: true })
  assignedToUserId: string; // Sales manager who manages this team member

  @Column({ nullable: true })
  department: string; // Sales department

  @Column({ nullable: true })
  employeeId: string; // Employee ID for tracking

  @Column({ nullable: true })
  phone: string; // Contact phone number

  @Column({ nullable: true })
  address: string; // Address

  @Column({ default: 0 })
  workloadScore: number; // Current workload score for lead assignment

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.createdBy)
  bookings: Booking[];

  @OneToMany('CustomerInteraction', 'user')
  interactions: any[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => ActivityLog, log => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => Payment, payment => payment.processedByUser)
  processedPayments: Payment[];

  @OneToMany(() => Payment, payment => payment.approvedByUser)
  approvedPayments: Payment[];

  @OneToMany(() => ConstructionProject, project => project.assignedUser)
  assignedConstructionProjects: ConstructionProject[];

  @OneToMany(() => ConstructionTask, task => task.assignedUser)
  assignedConstructionTasks: ConstructionTask[];

  @OneToMany(() => ConstructionExpense, expense => expense.submittedByUser)
  submittedExpenses: ConstructionExpense[];

  @OneToMany(() => ConstructionExpense, expense => expense.approvedByUser)
  approvedExpenses: ConstructionExpense[];

  @OneToMany(() => ConstructionDocument, document => document.uploadedByUser)
  uploadedConstructionDocuments: ConstructionDocument[];

  @OneToMany(() => ConstructionDocument, document => document.approvedByUser)
  approvedConstructionDocuments: ConstructionDocument[];

  @OneToMany(() => Document, document => document.uploadedByUser)
  uploadedDocuments: Document[];

  @OneToMany(() => Document, document => document.reviewedByUser)
  reviewedDocuments: Document[];

  @OneToMany(() => Notification, notification => notification.recipient)
  receivedNotifications: Notification[];

  @OneToMany(() => Notification, notification => notification.sender)
  sentNotifications: Notification[];

  @OneToMany(() => Message, message => message.recipient)
  receivedMessages: Message[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  // Lead relationships
  @OneToMany('Lead', 'generatedByUser')
  generatedLeads: any[];

  @OneToMany('Lead', 'assignedToUser')
  assignedLeads: any[];

  @OneToMany('Lead', 'convertedByUser')
  convertedLeads: any[];

  @OneToMany('LeadCommunication', 'user')
  leadCommunications: any[];

  @OneToMany('LeadNote', 'user')
  leadNotes: any[];

  @OneToMany(() => PaymentProof, paymentProof => paymentProof.uploadedByUser)
  uploadedPaymentProofs: PaymentProof[];

  @OneToMany('SalesActivity', 'user')
  salesActivities: any[];

  // Sales team management relationships
  @ManyToOne(() => User, user => user.managedTeamMembers, { nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedManager: User;

  @OneToMany(() => User, user => user.assignedManager)
  managedTeamMembers: User[];
} 