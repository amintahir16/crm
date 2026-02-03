import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  documentType: string;

  @Column()
  filePath: string;

  @Column()
  fileName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  fileSize: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, customer => customer.documents)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
} 