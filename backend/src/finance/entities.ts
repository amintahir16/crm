import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  VOIDED = 'voided',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accountCode: string;

  @Column()
  accountName: string;

  @Column({
    type: 'varchar',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column({ nullable: true })
  parentAccountId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, account => account.children)
  @JoinColumn({ name: 'parentAccountId' })
  parentAccount: Account;

  @OneToMany(() => Account, account => account.parentAccount)
  children: Account[];

  @OneToMany(() => JournalLine, line => line.account)
  journalLines: JournalLine[];
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  referenceNumber: string;

  @Column()
  entryDate: Date;

  @Column()
  description: string;

  @Column({
    type: 'varchar',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => JournalLine, line => line.journalEntry)
  journalLines: JournalLine[];
}

@Entity('journal_lines')
export class JournalLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journalEntryId: string;

  @Column()
  accountId: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  debitAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  creditAmount: number;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => JournalEntry, entry => entry.journalLines)
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: JournalEntry;

  @ManyToOne(() => Account, account => account.journalLines)
  @JoinColumn({ name: 'accountId' })
  account: Account;
} 