import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Booking } from '../bookings/booking.entity';

export enum NotificationType {
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_OVERDUE = 'payment_overdue',
  CONSTRUCTION_UPDATE = 'construction_update',
  DOCUMENT_APPROVED = 'document_approved',
  DOCUMENT_REJECTED = 'document_rejected',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  EXPENSE_APPROVED = 'expense_approved',
  EXPENSE_REJECTED = 'expense_rejected',
  CUSTOMER_INTERACTION = 'customer_interaction',
  AUDIT_ALERT = 'audit_alert',
  SECURITY_ALERT = 'security_alert',
  GENERAL = 'general',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'varchar',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'varchar',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({
    type: 'varchar',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({ nullable: true })
  recipientId: string; // User ID who should receive this notification

  @Column({ nullable: true })
  customerId: string; // Customer ID if notification is for a customer

  @Column({ nullable: true })
  bookingId: string; // Booking ID if notification is related to a booking

  @Column({ nullable: true })
  senderId: string; // User ID who sent this notification

  @Column({ type: 'text', nullable: true })
  metadata: string; // Additional data for the notification (JSON string)

  @Column({ type: 'text', nullable: true })
  actionData: string; // Data for action buttons or links (JSON string)

  @Column({ nullable: true })
  actionUrl: string; // URL to navigate to when notification is clicked

  @Column({ nullable: true })
  scheduledFor: Date; // When to send the notification (for scheduled notifications)

  @Column({ nullable: true })
  sentAt: Date; // When the notification was actually sent

  @Column({ nullable: true })
  readAt: Date; // When the notification was read

  @Column({ nullable: true })
  expiresAt: Date; // When the notification expires

  @Column({ default: false })
  isBroadcast: boolean; // Whether this is a broadcast notification to all users

  @Column({ default: false })
  requiresAction: boolean; // Whether this notification requires user action

  @Column({ nullable: true })
  category: string; // Category for grouping notifications

  @Column({ nullable: true })
  tags: string; // JSON string of tags

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.receivedNotifications)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @ManyToOne(() => User, user => user.sentNotifications)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne('Customer', 'notifications')
  @JoinColumn({ name: 'customerId' })
  customer: any;

  @ManyToOne(() => Booking, booking => booking.notifications)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;
}
