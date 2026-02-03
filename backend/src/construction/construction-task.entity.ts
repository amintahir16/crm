import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConstructionPhase } from './construction-phase.entity';
import { User } from '../users/user.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('construction_tasks')
export class ConstructionTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phaseId: string;

  @Column()
  taskName: string;

  @Column({
    type: 'varchar',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'varchar',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column('decimal', { precision: 12, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  actualCost: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  specifications: string;

  @Column('text', { nullable: true })
  materials: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true })
  contractorName: string;

  @Column({ nullable: true })
  contractorContact: string;

  @Column({ type: 'int', default: 1 })
  sequence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ConstructionPhase)
  @JoinColumn({ name: 'phaseId' })
  phase: ConstructionPhase;

  @ManyToOne(() => User, user => user.assignedConstructionTasks)
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: User;
}
