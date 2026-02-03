import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { User } from '../users/user.entity';

export enum PaymentProofType {
  SCREENSHOT = 'screenshot',
  BANK_SLIP = 'bank_slip',
  RECEIPT = 'receipt',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

@Entity('payment_proofs')
export class PaymentProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentId: string;

  @Column()
  fileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({
    type: 'varchar',
    enum: PaymentProofType,
    default: PaymentProofType.SCREENSHOT,
  })
  proofType: PaymentProofType;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Payment, payment => payment.paymentProofs)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => User, user => user.uploadedPaymentProofs)
  @JoinColumn({ name: 'uploadedBy' })
  uploadedByUser: User;
}
