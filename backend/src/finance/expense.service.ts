import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense, ExpenseCategory, ExpenseStatus } from './expense.entity';
import { Account } from './entities';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntity, AuditSeverity } from '../audit/audit-log.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private auditService: AuditService,
  ) {}

  async createExpense(createExpenseDto: {
    expenseName: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    dueDate?: Date;
    description?: string;
    vendorName?: string;
    vendorContact?: string;
    invoiceNumber?: string;
    accountId?: string;
    submittedBy: string;
  }): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      status: ExpenseStatus.PENDING,
    });

    const savedExpense = await this.expenseRepository.save(expense);

    // Audit log
    await this.auditService.log(
      createExpenseDto.submittedBy,
      AuditAction.CREATE,
      AuditEntity.EXPENSE,
      `Expense created: ${createExpenseDto.expenseName} - PKR ${createExpenseDto.amount}`,
      {
        entityId: savedExpense.id,
        newValues: { amount: createExpenseDto.amount, category: createExpenseDto.category },
        severity: AuditSeverity.MEDIUM,
      },
    );

    return savedExpense;
  }

  async getAllExpenses(options: {
    page?: number;
    limit?: number;
    category?: ExpenseCategory;
    status?: ExpenseStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    expenses: Expense[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50, category, status, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.submittedByUser', 'submittedBy')
      .leftJoinAndSelect('expense.approvedByUser', 'approvedBy')
      .orderBy('expense.expenseDate', 'DESC');

    if (category) {
      queryBuilder.andWhere('expense.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('expense.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [expenses, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      expenses,
      total,
      page,
      limit,
    };
  }

  async getExpenseById(id: string): Promise<Expense> {
    return await this.expenseRepository.findOne({
      where: { id },
      relations: ['submittedByUser', 'approvedByUser'],
    });
  }

  async updateExpense(
    id: string,
    updateExpenseDto: Partial<Expense>,
  ): Promise<Expense> {
    await this.expenseRepository.update(id, updateExpenseDto);
    return await this.getExpenseById(id);
  }

  async approveExpense(
    id: string,
    approvedBy: string,
    approved: boolean,
    rejectionReason?: string,
  ): Promise<Expense> {
    const expense = await this.getExpenseById(id);

    if (approved) {
      expense.status = ExpenseStatus.APPROVED;
      expense.approvedBy = approvedBy;
      expense.approvedAt = new Date();

      // Audit log
      await this.auditService.log(
        approvedBy,
        AuditAction.APPROVE,
        AuditEntity.EXPENSE,
        `Expense approved: ${expense.expenseName} - PKR ${expense.amount}`,
        {
          entityId: expense.id,
          severity: AuditSeverity.MEDIUM,
        },
      );
    } else {
      expense.status = ExpenseStatus.REJECTED;
      expense.rejectionReason = rejectionReason;

      // Audit log
      await this.auditService.log(
        approvedBy,
        AuditAction.REJECT,
        AuditEntity.EXPENSE,
        `Expense rejected: ${expense.expenseName} - ${rejectionReason}`,
        {
          entityId: expense.id,
          severity: AuditSeverity.MEDIUM,
        },
      );
    }

    return await this.expenseRepository.save(expense);
  }

  async markExpenseAsPaid(
    id: string,
    paidAmount: number,
    paidDate: Date,
    paymentMethod: string,
    receiptNumber?: string,
    referenceNumber?: string,
  ): Promise<Expense> {
    const expense = await this.getExpenseById(id);

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new Error('Expense must be approved before marking as paid');
    }

    expense.paidAmount = paidAmount;
    expense.paidDate = paidDate;
    expense.paymentMethod = paymentMethod;
    expense.receiptNumber = receiptNumber;
    expense.referenceNumber = referenceNumber;

    if (expense.paidAmount >= expense.amount) {
      expense.status = ExpenseStatus.PAID;

      // Audit log
      await this.auditService.log(
        expense.submittedBy || 'system',
        AuditAction.PAYMENT,
        AuditEntity.EXPENSE,
        `Expense marked as paid: ${expense.expenseName} - PKR ${paidAmount}`,
        {
          entityId: expense.id,
          severity: AuditSeverity.MEDIUM,
        },
      );
    }

    return await this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.expenseRepository.delete(id);
  }

  async getExpenseSummary(dateRange?: { start: Date; end: Date }): Promise<{
    totalExpenses: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    byCategory: Record<ExpenseCategory, { count: number; amount: number }>;
    byStatus: Record<ExpenseStatus, { count: number; amount: number }>;
  }> {
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (dateRange) {
      queryBuilder.where('expense.expenseDate BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const expenses = await queryBuilder.getMany();

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paidAmount = expenses
      .filter(e => e.status === ExpenseStatus.PAID)
      .reduce((sum, e) => sum + e.paidAmount, 0);
    const pendingAmount = totalAmount - paidAmount;

    // Group by category
    const byCategory = {} as Record<ExpenseCategory, { count: number; amount: number }>;
    Object.values(ExpenseCategory).forEach(category => {
      const categoryExpenses = expenses.filter(e => e.category === category);
      byCategory[category] = {
        count: categoryExpenses.length,
        amount: categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });

    // Group by status
    const byStatus = {} as Record<ExpenseStatus, { count: number; amount: number }>;
    Object.values(ExpenseStatus).forEach(status => {
      const statusExpenses = expenses.filter(e => e.status === status);
      byStatus[status] = {
        count: statusExpenses.length,
        amount: statusExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });

    return {
      totalExpenses,
      totalAmount,
      paidAmount,
      pendingAmount,
      byCategory,
      byStatus,
    };
  }
}

