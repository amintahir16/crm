import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, JournalEntry, JournalLine, AccountType, JournalEntryStatus } from './entities';
import { Installment } from './installment.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private journalLineRepository: Repository<JournalLine>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
  ) {}

  async getFinancialStats() {
    // Calculate financial statistics
    const totalRevenue = await this.calculateTotalRevenue();
    const totalExpenses = await this.calculateTotalExpenses();
    const netProfit = totalRevenue - totalExpenses;
    const pendingReceivables = await this.calculatePendingReceivables();
    const overduePayments = await this.calculateOverduePayments();
    const monthlyRevenue = await this.calculateMonthlyRevenue();
    const monthlyExpenses = await this.calculateMonthlyExpenses();
    const cashFlow = await this.calculateCashFlow();

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingReceivables,
      overduePayments,
      monthlyRevenue,
      monthlyExpenses,
      cashFlow,
    };
  }

  async getRecentTransactions() {
    const recentEntries = await this.journalEntryRepository.find({
      relations: ['journalLines', 'journalLines.account'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return recentEntries.map(entry => ({
      id: entry.id,
      type: this.determineTransactionType(entry),
      description: entry.description,
      amount: this.calculateEntryAmount(entry),
      date: entry.entryDate,
      status: entry.status,
      category: this.getTransactionCategory(entry),
    }));
  }

  async getChartOfAccounts() {
    return await this.accountRepository.find({
      relations: ['parentAccount', 'children'],
      order: { accountCode: 'ASC' },
    });
  }

  async createAccount(createAccountDto: any) {
    const account = this.accountRepository.create(createAccountDto);
    return await this.accountRepository.save(account);
  }

  async getJournalEntries() {
    return await this.journalEntryRepository.find({
      relations: ['journalLines', 'journalLines.account'],
      order: { entryDate: 'DESC' },
    });
  }

  async createJournalEntry(createJournalEntryDto: any) {
    const journalEntry = this.journalEntryRepository.create({
      ...createJournalEntryDto,
      referenceNumber: this.generateReferenceNumber(),
    });
    
    const savedEntry = (await this.journalEntryRepository.save(journalEntry))[0];
    
    // Create journal lines
    if (createJournalEntryDto.lines && Array.isArray(createJournalEntryDto.lines)) {
      for (const line of createJournalEntryDto.lines) {
        const journalLine = this.journalLineRepository.create({
          ...line,
          journalEntryId: savedEntry.id,
        });
        await this.journalLineRepository.save(journalLine);
      }
    }
    
    return savedEntry;
  }

  async getBankReconciliation() {
    // Implementation for bank reconciliation
    return {
      bankBalance: 0,
      bookBalance: 0,
      outstandingDeposits: [],
      outstandingChecks: [],
    };
  }

  async getTaxSummary() {
    // Implementation for tax summary
    return {
      totalVAT: 0,
      totalWithholdingTax: 0,
      taxPayable: 0,
    };
  }

  private async calculateTotalRevenue(): Promise<number> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.account', 'account')
      .where('account.accountType = :type', { type: AccountType.REVENUE })
      .select('SUM(line.creditAmount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculateTotalExpenses(): Promise<number> {
    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.account', 'account')
      .where('account.accountType = :type', { type: AccountType.EXPENSE })
      .select('SUM(line.debitAmount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculatePendingReceivables(): Promise<number> {
    const result = await this.installmentRepository
      .createQueryBuilder('installment')
      .where('installment.status = :status', { status: 'pending' })
      .select('SUM(installment.amount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculateOverduePayments(): Promise<number> {
    const result = await this.installmentRepository
      .createQueryBuilder('installment')
      .where('installment.dueDate < :today', { today: new Date() })
      .andWhere('installment.status = :status', { status: 'pending' })
      .select('SUM(installment.amount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculateMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.account', 'account')
      .innerJoin('line.journalEntry', 'entry')
      .where('account.accountType = :type', { type: AccountType.REVENUE })
      .andWhere('entry.entryDate >= :startDate', { startDate: startOfMonth })
      .select('SUM(line.creditAmount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculateMonthlyExpenses(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin('line.account', 'account')
      .innerJoin('line.journalEntry', 'entry')
      .where('account.accountType = :type', { type: AccountType.EXPENSE })
      .andWhere('entry.entryDate >= :startDate', { startDate: startOfMonth })
      .select('SUM(line.debitAmount)', 'total')
      .getRawOne();
    
    return parseFloat(result?.total || '0');
  }

  private async calculateCashFlow(): Promise<number> {
    const monthlyRevenue = await this.calculateMonthlyRevenue();
    const monthlyExpenses = await this.calculateMonthlyExpenses();
    return monthlyRevenue - monthlyExpenses;
  }

  private determineTransactionType(entry: JournalEntry): string {
    // Logic to determine transaction type based on journal lines
    return 'income';
  }

  private calculateEntryAmount(entry: JournalEntry): number {
    return entry.journalLines.reduce((sum, line) => sum + line.debitAmount + line.creditAmount, 0);
  }

  private getTransactionCategory(entry: JournalEntry): string {
    // Logic to determine transaction category
    return 'General';
  }

  private generateReferenceNumber(): string {
    const timestamp = Date.now();
    return `JE-${timestamp}`;
  }
} 