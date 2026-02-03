import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';

export enum CommunicationType {
  PHONE_CALL = 'phone_call',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  SMS = 'sms',
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  OTHER = 'other'
}

export enum CommunicationDirection {
  INBOUND = 'inbound',  // Lead contacted us
  OUTBOUND = 'outbound' // We contacted the lead
}

export enum CommunicationOutcome {
  SUCCESSFUL = 'successful',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  VOICEMAIL = 'voicemail',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  CALLBACK_REQUESTED = 'callback_requested',
  MEETING_SCHEDULED = 'meeting_scheduled',
  INFORMATION_SENT = 'information_sent',
  OTHER = 'other'
}

@Entity('lead_communications')
export class LeadCommunication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leadId: string;

  @Column()
  userId: string; // Sales agent who made/received the communication

  @Column({
    type: 'varchar',
    enum: CommunicationType,
  })
  type: CommunicationType;

  @Column({
    type: 'varchar',
    enum: CommunicationDirection,
  })
  direction: CommunicationDirection;

  @Column({
    type: 'varchar',
    enum: CommunicationOutcome,
    nullable: true,
  })
  outcome: CommunicationOutcome;

  @Column()
  subject: string;

  @Column('text')
  description: string; // Details of the communication

  @Column({ nullable: true })
  duration: number; // Duration in minutes (for calls)

  @Column({ nullable: true })
  scheduledAt: Date; // For scheduled communications

  @Column({ nullable: true })
  completedAt: Date; // When the communication was completed

  @Column({ nullable: true })
  nextFollowUpAt: Date; // When to follow up next

  @Column('text', { nullable: true })
  attachments: string; // JSON array of file paths/URLs

  @Column({ default: false })
  isImportant: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Lead, lead => lead.communications)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ManyToOne(() => User, user => user.leadCommunications)
  @JoinColumn({ name: 'userId' })
  user: User;
}
