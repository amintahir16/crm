import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { Booking } from '../bookings/booking.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { Installment, InstallmentStatus } from './installment.entity';
import { PaymentPlan, PaymentPlanStatus } from './payment-plan.entity';
import { Expense, ExpenseStatus } from './expense.entity';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(PaymentPlan)
    private paymentPlanRepository: Repository<PaymentPlan>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  @Get('summary')
  async getFinanceSummary() {
    // Total revenue from all non-cancelled bookings
    const bookings = await this.bookingRepository.find();
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    // Amount collected from completed payments
    const completedPayments = await this.paymentRepository.find({
      where: { status: PaymentStatus.COMPLETED },
    });
    const totalPaid = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Pending amount
    const totalPending = Math.max(0, totalRevenue - totalPaid);

    // Total active/in-progress bookings
    const totalBookingsCount = activeBookings.filter(b => b.status !== 'completed').length;

    // Active payment plans
    const activePaymentPlans = await this.paymentPlanRepository.count({
      where: { status: PaymentPlanStatus.ACTIVE },
    });

    // Overdue installments
    const overdueInstallments = await this.installmentRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: InstallmentStatus.PENDING,
      },
    });
    const overduePayments = overdueInstallments.length;
    const overdueAmount = overdueInstallments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // Monthly revenue (booking value) comparison
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonthRevenue = bookings
      .filter(b => new Date(b.createdAt) >= currentMonthStart)
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const lastMonthRevenue = bookings
      .filter(b => {
        const d = new Date(b.createdAt);
        return d >= lastMonthStart && d <= lastMonthEnd;
      })
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const growthVal = lastMonthRevenue > 0 
      ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const monthlyGrowthText = `${Math.abs(growthVal)}% from last month`;
    const growthIndicator = growthVal >= 0 ? 'up' : 'down';

    // Total expenses (only approved or paid ones)
    const expenses = await this.expenseRepository.find({
      where: [
        { status: ExpenseStatus.APPROVED },
        { status: ExpenseStatus.PAID }
      ]
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Collection rate
    const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    // Cash flow = collected - expenses
    const cashFlow = totalPaid - totalExpenses;

    return {
      totalRevenue,
      totalPaid,
      totalPending,
      totalBookings: totalBookingsCount,
      activePaymentPlans,
      overduePayments,
      overdueAmount,
      monthlyGrowthText,
      growthIndicator,
      totalExpenses,
      collectionRate,
      cashFlow,
      currentMonthRevenue,
    };
  }

  @Get('overview')
  async getFinanceOverview(@Request() req) {
    const stats = await this.financeService.getFinancialStats();
    const recentTransactions = await this.financeService.getRecentTransactions();
    
    return {
      stats,
      recentTransactions,
    };
  }

  @Get('accounts')
  async getChartOfAccounts() {
    return await this.financeService.getChartOfAccounts();
  }

  @Post('accounts')
  async createAccount(@Body() createAccountDto: any) {
    return await this.financeService.createAccount(createAccountDto);
  }

  @Get('journal')
  async getJournalEntries() {
    return await this.financeService.getJournalEntries();
  }

  @Post('journal')
  async createJournalEntry(@Body() createJournalEntryDto: any) {
    return await this.financeService.createJournalEntry(createJournalEntryDto);
  }

  @Get('reconciliation')
  async getBankReconciliation() {
    return await this.financeService.getBankReconciliation();
  }

  @Get('tax')
  async getTaxSummary() {
    return await this.financeService.getTaxSummary();
  }
} 