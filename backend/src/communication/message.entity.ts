import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum MessageType {
  INTERNAL = 'internal',
  CUSTOMER = 'customer',
  BROADCAST = 'broadcast',
  SYSTEM = 'system',
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum MessageChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
  IN_APP = 'in_app',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column({
    type: 'varchar',
    enum: MessageType,
  })
  type: MessageType;

  @Column({
    type: 'varchar',
    enum: MessageStatus,
    default: MessageStatus.DRAFT,
  })
  status: MessageStatus;

  @Column({
    type: 'varchar',
    enum: MessageChannel,
  })
  channel: MessageChannel;

  @Column({ nullable: true })
  senderId: string;

  @Column({ nullable: true })
  recipientId: string; // User ID for internal messages

  @Column({ nullable: true })
  customerId: string; // Customer ID for customer messages

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // Additional data for the message (JSON string)

  @Column({ nullable: true })
  scheduledFor: Date; // When to send the message

  @Column({ nullable: true })
  sentAt: Date; // When the message was actually sent

  @Column({ nullable: true })
  deliveredAt: Date; // When the message was delivered

  @Column({ nullable: true })
  readAt: Date; // When the message was read

  @Column({ nullable: true })
  externalId: string; // ID from external service (SMS provider, email service, etc.)

  @Column({ nullable: true })
  errorMessage: string; // Error message if sending failed

  @Column({ default: false })
  isTemplate: boolean; // Whether this is a message template

  @Column({ nullable: true })
  templateId: string; // ID of the template if this is based on a template

  @Column({ type: 'text', nullable: true })
  templateVariables: string; // Variables used in template (JSON string)

  @Column({ default: false })
  isBroadcast: boolean; // Whether this is a broadcast message

  @Column({ nullable: true })
  category: string; // Category for grouping messages

  @Column({ nullable: true })
  tags: string; // JSON string of tags

  @Column({ default: 0 })
  retryCount: number; // Number of retry attempts

  @Column({ nullable: true })
  nextRetryAt: Date; // When to retry sending

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.sentMessages)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, user => user.receivedMessages)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @ManyToOne('Customer', 'messages')
  @JoinColumn({ name: 'customerId' })
  customer: any;

  @OneToMany(() => MessageAttachment, attachment => attachment.message)
  attachments: MessageAttachment[];
}

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Message, message => message.attachments)
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
