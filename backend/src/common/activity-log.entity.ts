import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column('json', { nullable: true })
  oldValues: any;

  @Column('json', { nullable: true })
  newValues: any;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.activityLogs)
  @JoinColumn({ name: 'userId' })
  user: User;
} 