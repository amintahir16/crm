import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Plot } from '../plots/plot.entity';
import { Installment } from '../finance/installment.entity';
import { PaymentSchedule } from '../finance/payment-schedule.entity';
import { ConstructionProject } from '../construction/construction-project.entity';
import { Document } from '../documents/document.entity';
import { Notification } from '../communication/notification.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  plotId: string;

  @Column()
  createdById: string;

  @Column('decimal', { precision: 12, scale: 2 })
  downPayment: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  // Track actual payments made
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  // Computed field: totalAmount - paidAmount
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  pendingAmount: number;

  @Column({
    type: 'varchar',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column()
  bookingDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, customer => customer.bookings)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Plot, plot => plot.bookings)
  @JoinColumn({ name: 'plotId' })
  plot: Plot;

  @ManyToOne(() => User, user => user.bookings)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => Installment, installment => installment.booking)
  installments: Installment[];

  @OneToMany(() => PaymentSchedule, paymentSchedule => paymentSchedule.booking)
  paymentSchedules: PaymentSchedule[];

  @OneToMany(() => ConstructionProject, project => project.booking)
  constructionProjects: ConstructionProject[];

  @OneToMany(() => Document, document => document.booking)
  documents: Document[];

  @OneToMany(() => Notification, notification => notification.booking)
  notifications: Notification[];
} 