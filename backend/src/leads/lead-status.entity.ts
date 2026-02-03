import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lead_statuses')
export class LeadStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'new', 'interested', 'close_won'

  @Column()
  displayName: string; // e.g., 'New', 'Interested', 'Close Won'

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: '#6B7280' })
  color: string; // Hex color for UI display

  @Column({ default: 0 })
  order: number; // Display order

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean; // Default status for new leads

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

