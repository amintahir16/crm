import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { Document } from '../documents/document.entity';

export enum ConstructionStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ConstructionType {
  VILLA = 'villa',
  COTTAGE = 'cottage',
  APARTMENT = 'apartment',
  COMMERCIAL = 'commercial',
  CUSTOM = 'custom',
}

@Entity('construction_projects')
export class ConstructionProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  projectName: string;

  @Column({
    type: 'varchar',
    enum: ConstructionType,
    default: ConstructionType.VILLA,
  })
  constructionType: ConstructionType;

  @Column({
    type: 'varchar',
    enum: ConstructionStatus,
    default: ConstructionStatus.PLANNING,
  })
  status: ConstructionStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  estimatedCost: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  actualCost: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedCompletionDate: Date;

  @Column({ type: 'date', nullable: true })
  actualCompletionDate: Date;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  specifications: string;

  @Column('text', { nullable: true })
  materials: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  architectName: string;

  @Column({ nullable: true })
  architectContact: string;

  @Column({ nullable: true })
  contractorName: string;

  @Column({ nullable: true })
  contractorContact: string;

  @Column({ nullable: true })
  supervisorName: string;

  @Column({ nullable: true })
  supervisorContact: string;

  @Column({ nullable: true })
  assignedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Booking, booking => booking.constructionProjects)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => User, user => user.assignedConstructionProjects)
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: User;

  // @OneToMany(() => ConstructionPhase, phase => phase.project)
  // phases: ConstructionPhase[];

  // @OneToMany(() => ConstructionExpense, expense => expense.project)
  // expenses: ConstructionExpense[];

  // @OneToMany(() => ConstructionDocument, document => document.project)
  // documents: ConstructionDocument[];

  @OneToMany(() => Document, document => document.constructionProject)
  generalDocuments: Document[];
}
