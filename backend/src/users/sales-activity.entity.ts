import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum SalesActivityType {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_CONVERTED = 'lead_converted',
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  BOOKING_CREATED = 'booking_created',
  BOOKING_UPDATED = 'booking_updated',
  INTERACTION_LOGGED = 'interaction_logged',
  CALL_MADE = 'call_made',
  EMAIL_SENT = 'email_sent',
  MEETING_SCHEDULED = 'meeting_scheduled',
  SITE_VISIT_CONDUCTED = 'site_visit_conducted',
  FOLLOW_UP_COMPLETED = 'follow_up_completed',
  DOCUMENT_UPLOADED = 'document_uploaded',
  PAYMENT_DISCUSSED = 'payment_discussed',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Entity('sales_activities')
export class SalesActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'varchar',
    enum: SalesActivityType,
  })
  activityType: SalesActivityType;

  @Column()
  description: string;

  @Column({ nullable: true })
  entityType: string; // 'lead', 'customer', 'booking', etc.

  @Column({ nullable: true })
  entityId: string; // ID of the related entity

  @Column('json', { nullable: true })
  metadata: any; // Additional data about the activity

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  potentialValue: number; // Potential revenue from this activity

  @Column({ nullable: true })
  duration: number; // Duration in minutes (for calls, meetings)

  @Column({ default: false })
  isSuccessful: boolean; // Whether the activity was successful

  @Column('text', { nullable: true })
  notes: string; // Additional notes about the activity

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.salesActivities)
  @JoinColumn({ name: 'userId' })
  user: User;
}
