import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { Customer } from '../customers/customer.entity';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';

export enum OwnershipType {
  INITIAL_REGISTRATION = 'initial_registration',
  SALE = 'sale',
  TRANSFER = 'transfer',
  CANCELLATION = 'cancellation',
}

@Entity('plot_ownership_history')
export class PlotOwnershipHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  plotId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({
    type: 'varchar',
    enum: OwnershipType,
  })
  ownershipType: OwnershipType;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'date', nullable: true })
  registrationDate: Date;

  @Column({ type: 'date', nullable: true })
  transferDate: Date;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  transferDocumentNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  recordedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Plot)
  @JoinColumn({ name: 'plotId' })
  plot: Plot;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recordedBy' })
  recordedByUser: User;
}

