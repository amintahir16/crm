import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlotSizeType {
  MARLA_3 = '3_marla',
  MARLA_5 = '5_marla',
  MARLA_7 = '7_marla',
  MARLA_10 = '10_marla',
  KANAL_1 = '1_kanal',
  KANAL_2 = '2_kanal',
}

@Entity('plot_size_pricing')
export class PlotSizePricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    enum: PlotSizeType,
    unique: true,
  })
  sizeType: PlotSizeType;

  @Column('decimal', { precision: 5, scale: 2 })
  sizeMarla: number;

  @Column('decimal', { precision: 8, scale: 2 })
  sizeSqm: number;

  @Column('decimal', { precision: 12, scale: 2 })
  basePrice: number;

  @Column('decimal', { precision: 12, scale: 2 })
  downPaymentPercentage: number;

  @Column('decimal', { precision: 12, scale: 2 })
  downPaymentAmount: number;

  @Column({ default: 24 })
  installmentCount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  installmentAmount: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  lateFeeRate: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
