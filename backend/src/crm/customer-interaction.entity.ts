import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum InteractionType {
  PHONE_CALL = 'phone_call',
  EMAIL = 'email',
  MEETING = 'meeting',
  SITE_VISIT = 'site_visit',
  FOLLOW_UP = 'follow_up',
  COMPLAINT = 'complaint',
  INQUIRY = 'inquiry',
  PAYMENT_DISCUSSION = 'payment_discussion',
  DOCUMENT_SUBMISSION = 'document_submission',
}

export enum InteractionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

@Entity('customer_interactions')
export class CustomerInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  userId: string;

  @Column({
    type: 'varchar',
    enum: InteractionType,
  })
  type: InteractionType;

  @Column({
    type: 'varchar',
    enum: InteractionStatus,
    default: InteractionStatus.SCHEDULED,
  })
  status: InteractionStatus;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column({ nullable: true })
  duration: number; // in minutes

  @Column('text', { nullable: true })
  outcome: string;

  @Column('text', { nullable: true })
  nextSteps: string;

  @Column({ nullable: true })
  nextFollowUpDate: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  amountDiscussed: number;

  @Column({ default: false })
  isImportant: boolean;

  @Column({ default: false })
  requiresFollowUp: boolean;

  @Column('text', { nullable: true })
  attachments: string; // JSON array of file paths

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('Customer', 'interactions')
  @JoinColumn({ name: 'customerId' })
  customer: any;

  @ManyToOne(() => User, user => user.interactions)
  @JoinColumn({ name: 'userId' })
  user: User;
}
