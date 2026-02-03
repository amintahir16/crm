import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';

export enum LeadActivityType {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  REASSIGNED = 'reassigned',
  COMMUNICATION_ADDED = 'communication_added',
  NOTE_ADDED = 'note_added',
  NOTE_UPDATED = 'note_updated',
  DUE_DATE_SET = 'due_date_set',
  DUE_DATE_CHANGED = 'due_date_changed',
  PRIORITY_CHANGED = 'priority_changed',
  CONVERTED = 'converted',
  UPDATED = 'updated',
  VIEWED = 'viewed',
}

@Entity('lead_activity_log')
@Index(['leadId'])
@Index(['userId'])
@Index(['activityType'])
export class LeadActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leadId: string;

  @Column({ nullable: true })
  userId: string; // User who performed the action

  @Column({
    type: 'varchar',
    enum: LeadActivityType,
  })
  activityType: LeadActivityType;

  @Column('text')
  description: string; // Human-readable description

  @Column('text', { nullable: true })
  metadata: string; // JSON string with additional data (old value, new value, etc.)

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

