import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ConstructionProject } from './construction-project.entity';

export enum PhaseStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum PhaseType {
  FOUNDATION = 'foundation',
  STRUCTURE = 'structure',
  ROOFING = 'roofing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FINISHING = 'finishing',
  LANDSCAPING = 'landscaping',
  INSPECTION = 'inspection',
  HANDOVER = 'handover',
}

@Entity('construction_phases')
export class ConstructionPhase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  phaseName: string;

  @Column({
    type: 'varchar',
    enum: PhaseType,
  })
  phaseType: PhaseType;

  @Column({
    type: 'varchar',
    enum: PhaseStatus,
    default: PhaseStatus.PENDING,
  })
  status: PhaseStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  actualCost: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedEndDate: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  specifications: string;

  @Column('text', { nullable: true })
  materials: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  contractorName: string;

  @Column({ nullable: true })
  contractorContact: string;

  @Column({ nullable: true })
  supervisorName: string;

  @Column({ nullable: true })
  supervisorContact: string;

  @Column({ type: 'int', default: 1 })
  sequence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ConstructionProject)
  @JoinColumn({ name: 'projectId' })
  project: ConstructionProject;

  // @OneToMany(() => ConstructionTask, task => task.phase)
  // tasks: ConstructionTask[];
}
