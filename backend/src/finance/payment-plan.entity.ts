import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PaymentSchedule } from './payment-schedule.entity';

export enum PaymentPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 5, scale: 2 })
  plotSizeMarla: number;

  @Column('decimal', { precision: 12, scale: 2 })
  plotPrice: number;

  // Down payment configuration
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  downPaymentAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  downPaymentPercentage: number;

  // Monthly payments
  @Column('decimal', { precision: 12, scale: 2 })
  monthlyPayment: number;

  // Optional quarterly payments
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  quarterlyPayment: number;

  // Optional bi-yearly payments
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  biYearlyPayment: number;

  // Optional triannual (3-yearly) payments
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  triannualPayment: number;

  // Tenure in months (default 24)
  @Column({ default: 24 })
  tenureMonths: number;

  @Column({
    type: 'varchar',
    enum: PaymentPlanStatus,
    default: PaymentPlanStatus.ACTIVE,
  })
  status: PaymentPlanStatus;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PaymentSchedule, paymentSchedule => paymentSchedule.paymentPlan)
  paymentSchedules: PaymentSchedule[];
}
