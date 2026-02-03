import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  LEAD_DUE_TODAY = 'lead_due_today',
  LEAD_DUE_PASSED = 'lead_due_passed',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_REASSIGNED = 'lead_reassigned',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_NOTE_ADDED = 'lead_note_added',
  LEAD_COMMUNICATION_ADDED = 'lead_communication_added',
  LEAD_CONVERTED = 'lead_converted',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_UPDATED = 'team_member_updated',
}

@Entity('crm_notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['type'])
export class CrmNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // User to notify

  @Column({
    type: 'varchar',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  entityType: string; // 'lead', 'team_member', etc.

  @Column({ nullable: true })
  entityId: string; // ID of the related entity

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

