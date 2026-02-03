import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Booking } from '../bookings/booking.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cnic: string;

  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column('text')
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.customer)
  bookings: Booking[];

  @OneToMany('Document', 'customer')
  documents: any[];

  @OneToMany('CustomerInteraction', 'customer')
  interactions: any[];

  @OneToMany('Notification', 'customer')
  notifications: any[];

  @OneToMany('Message', 'customer')
  messages: any[];

  // Lead conversion tracking
  @OneToMany('Lead', 'convertedToCustomer')
  convertedFromLeads: any[];
} 