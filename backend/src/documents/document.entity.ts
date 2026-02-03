import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Booking } from '../bookings/booking.entity';
import { ConstructionProject } from '../construction/construction-project.entity';

export enum DocumentType {
  CNIC = 'cnic',
  PASSPORT = 'passport',
  CONTRACT = 'contract',
  AGREEMENT = 'agreement',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PAYMENT_PROOF = 'payment_proof',
  BANK_STATEMENT = 'bank_statement',
  PROPERTY_DEED = 'property_deed',
  SURVEY_REPORT = 'survey_report',
  LEGAL_DOCUMENT = 'legal_document',
  PERMIT = 'permit',
  LICENSE = 'license',
  CERTIFICATE = 'certificate',
  INSURANCE = 'insurance',
  WARRANTY = 'warranty',
  MANUAL = 'manual',
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
}

export enum DocumentCategory {
  CUSTOMER_DOCUMENT = 'customer_document',
  BOOKING_DOCUMENT = 'booking_document',
  PLOT_DOCUMENT = 'plot_document',
  CONSTRUCTION_DOCUMENT = 'construction_document',
  FINANCIAL_DOCUMENT = 'financial_document',
  LEGAL_DOCUMENT = 'legal_document',
  ADMINISTRATIVE_DOCUMENT = 'administrative_document',
  MARKETING_DOCUMENT = 'marketing_document',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentName: string;

  @Column({
    type: 'varchar',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({
    type: 'varchar',
    enum: DocumentCategory,
  })
  category: DocumentCategory;

  @Column({
    type: 'varchar',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  fileHash: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ type: 'date', nullable: true })
  documentDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  version: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isEncrypted: boolean;

  @Column({ nullable: true })
  tags: string; // JSON string of tags

  @Column({ nullable: true })
  metadata: string; // JSON string of additional metadata

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  // Optional relationships - documents can be associated with different entities
  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ nullable: true })
  plotId: string;

  @Column({ nullable: true })
  constructionProjectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.uploadedDocuments)
  @JoinColumn({ name: 'uploadedBy' })
  uploadedByUser: User;

  @ManyToOne(() => User, user => user.reviewedDocuments)
  @JoinColumn({ name: 'reviewedBy' })
  reviewedByUser: User;

  @ManyToOne('Customer', 'documents')
  @JoinColumn({ name: 'customerId' })
  customer: any;

  @ManyToOne(() => Booking, booking => booking.documents)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne('Plot', 'documents')
  @JoinColumn({ name: 'plotId' })
  plot: any;

  @ManyToOne(() => ConstructionProject)
  @JoinColumn({ name: 'constructionProjectId' })
  constructionProject: ConstructionProject;
}
