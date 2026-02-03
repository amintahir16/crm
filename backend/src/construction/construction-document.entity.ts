import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConstructionProject } from './construction-project.entity';
import { User } from '../users/user.entity';

export enum DocumentType {
  BLUEPRINT = 'blueprint',
  PERMIT = 'permit',
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  INSPECTION_REPORT = 'inspection_report',
  PROGRESS_PHOTO = 'progress_photo',
  MATERIAL_SPECIFICATION = 'material_specification',
  SAFETY_CERTIFICATE = 'safety_certificate',
  WARRANTY = 'warranty',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Entity('construction_documents')
export class ConstructionDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  documentName: string;

  @Column({
    type: 'varchar',
    enum: DocumentType,
  })
  documentType: DocumentType;

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

  @Column({ nullable: true })
  uploadedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ConstructionProject)
  @JoinColumn({ name: 'projectId' })
  project: ConstructionProject;

  @ManyToOne(() => User, user => user.uploadedDocuments)
  @JoinColumn({ name: 'uploadedBy' })
  uploadedByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser: User;
}
