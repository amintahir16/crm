import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';

export enum LeadSource {
  WHATSAPP = 'whatsapp',
  FACEBOOK_ADS = 'facebook_ads',
  INSTAGRAM_ADS = 'instagram_ads',
  GOOGLE_ADS = 'google_ads',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  WALK_IN = 'walk_in',
  PHONE_CALL = 'phone_call',
  OTHER = 'other'
}

export enum LeadStatus {
  NEW = 'new',
  NOT_INTERESTED = 'not_interested',
  INTERESTED = 'interested',
  WILL_VISIT = 'will_visit',
  FUTURE = 'future',
  CLOSE_WON = 'close_won',
  IN_PROCESS = 'in_process',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  leadId: string; // Unique identifier (from CSV or auto-generated)

  @Column()
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'varchar',
    enum: LeadSource,
  })
  source: LeadSource;

  @Column({ nullable: true })
  sourceDetails: string; // Additional details about the source (e.g., campaign name, referrer name)

  @Column({
    type: 'varchar',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Column({ nullable: true })
  statusId: string; // Reference to lead_statuses table

  @Column({ type: 'date', nullable: true })
  dueDate: Date; // Due date for follow-up (not editable by sales person)

  @Column({
    type: 'varchar',
    enum: LeadPriority,
    default: LeadPriority.MEDIUM,
  })
  priority: LeadPriority;

  @Column('text', { nullable: true })
  initialNotes: string; // Notes from when the lead was first created

  @Column('text', { nullable: true })
  interests: string; // What they're interested in (plot size, location, etc.)

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  budgetRange: number; // Their budget range

  @Column({ nullable: true })
  preferredContactMethod: string; // phone, email, whatsapp

  @Column({ nullable: true })
  preferredContactTime: string; // morning, afternoon, evening

  // Sales agent who generated the lead (optional for social media ads)
  @Column({ nullable: true })
  generatedByUserId: string;

  // Sales agent assigned to follow up on the lead
  @Column({ nullable: true })
  assignedToUserId: string;

  // If the lead converted to a customer
  @Column({ nullable: true })
  convertedToCustomerId: string;

  @Column({ nullable: true })
  convertedAt: Date;

  // Sales agent who converted the lead
  @Column({ nullable: true })
  convertedByUserId: string;

  @Column({ nullable: true })
  lastContactedAt: Date;

  @Column({ nullable: true })
  nextFollowUpAt: Date;

  @Column('text', { nullable: true })
  tags: string; // JSON array of tags for categorization

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.generatedLeads, { nullable: true })
  @JoinColumn({ name: 'generatedByUserId' })
  generatedByUser: User;

  @ManyToOne(() => User, user => user.assignedLeads, { nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser: User;

  @ManyToOne(() => User, user => user.convertedLeads, { nullable: true })
  @JoinColumn({ name: 'convertedByUserId' })
  convertedByUser: User;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'convertedToCustomerId' })
  convertedToCustomer: Customer;

  @OneToMany('LeadCommunication', 'lead')
  communications: any[];

  @OneToMany('LeadNote', 'lead')
  notes: any[];
}
