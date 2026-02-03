import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAYMENT = 'payment',
  BOOKING = 'booking',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum AuditEntity {
  CUSTOMER = 'customer',
  PLOT = 'plot',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  PAYMENT_SCHEDULE = 'payment_schedule',
  INSTALLMENT = 'installment',
  EXPENSE = 'expense',
  USER = 'user',
  DOCUMENT = 'document',
  INTERACTION = 'interaction',
  SYSTEM = 'system',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'varchar',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'varchar',
    enum: AuditEntity,
  })
  entity: AuditEntity;

  @Column({ nullable: true })
  entityId: string;

  @Column('text', { nullable: true })
  oldValues: string; // JSON string of old values

  @Column('text', { nullable: true })
  newValues: string; // JSON string of new values

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: AuditSeverity,
    default: AuditSeverity.LOW,
  })
  severity: AuditSeverity;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column('text', { nullable: true })
  metadata: string; // JSON string for additional data

  @Column({ default: false })
  isSensitive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: User;
}
