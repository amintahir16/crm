import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';

export enum NoteType {
  GENERAL = 'general',
  FOLLOW_UP = 'follow_up',
  MEETING = 'meeting',
  PHONE_CALL = 'phone_call',
  QUALIFICATION = 'qualification',
  OBJECTION = 'objection',
  INTEREST = 'interest',
  BUDGET = 'budget',
  TIMELINE = 'timeline',
  DECISION_MAKER = 'decision_maker',
  COMPETITOR = 'competitor',
  OTHER = 'other'
}

@Entity('lead_notes')
export class LeadNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leadId: string;

  @Column()
  userId: string; // User who created the note

  @Column({
    type: 'varchar',
    enum: NoteType,
    default: NoteType.GENERAL,
  })
  type: NoteType;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isImportant: boolean;

  @Column({ default: false })
  isPrivate: boolean; // Only visible to the creator

  @Column('text', { nullable: true })
  tags: string; // JSON array of tags

  @Column({ nullable: true })
  reminderAt: Date; // Set a reminder for this note

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Lead, lead => lead.notes)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ManyToOne(() => User, user => user.leadNotes)
  @JoinColumn({ name: 'userId' })
  user: User;
}
