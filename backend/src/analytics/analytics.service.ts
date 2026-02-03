import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Plot, PlotStatus } from '../plots/plot.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';
import { PaymentSchedule } from '../finance/payment-schedule.entity';
import { Installment } from '../finance/installment.entity';
import { ConstructionProject, ConstructionStatus } from '../construction/construction-project.entity';
import { Document } from '../documents/document.entity';
import { Notification } from '../communication/notification.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(ConstructionProject)
    private projectRepository: Repository<ConstructionProject>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  // Dashboard Analytics
  async getDashboardAnalytics(): Promise<{
    totalCustomers: number;
    totalPlots: number;
    availablePlots: number;
    soldPlots: number;
    totalBookings: number;
    activeBookings: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingPayments: number;
    overduePayments: number;
    activeProjects: number;
    completedProjects: number;
    totalDocuments: number;
    unreadNotifications: number;
    recentActivity: any[];
  }> {
    const [
      totalCustomers,
      totalPlots,
      availablePlots,
      soldPlots,
      totalBookings,
      activeBookings,
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      overduePayments,
      activeProjects,
      completedProjects,
      totalDocuments,
      unreadNotifications
    ] = await Promise.all([
      this.customerRepository.count(),
      this.plotRepository.count(),
      this.plotRepository.count({ where: { status: PlotStatus.AVAILABLE } }),
      this.plotRepository.count({ where: { status: PlotStatus.SOLD } }),
      this.bookingRepository.count(),
      this.bookingRepository.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.getTotalRevenue(),
      this.getMonthlyRevenue(),
      this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } }),
      this.getOverduePayments(),
      this.projectRepository.count({ where: { status: ConstructionStatus.IN_PROGRESS } }),
      this.projectRepository.count({ where: { status: ConstructionStatus.COMPLETED } }),
      this.documentRepository.count(),
      this.notificationRepository.count({ where: { readAt: null } })
    ]);

    const recentActivity = await this.getRecentActivity();

    return {
      totalCustomers,
      totalPlots,
      availablePlots,
      soldPlots,
      totalBookings,
      activeBookings,
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      overduePayments,
      activeProjects,
      completedProjects,
      totalDocuments,
      unreadNotifications,
      recentActivity
    };
  }

  // Sales Analytics
  async getSalesAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalSales: number;
    monthlySales: Array<{ month: string; amount: number; count: number }>;
    salesByPlotSize: Array<{ size: string; amount: number; count: number }>;
    salesByPaymentType: Array<{ type: string; amount: number; count: number }>;
    topCustomers: Array<{ customer: string; amount: number; bookings: number }>;
    conversionRate: number;
    averageDealSize: number;
    salesTrend: Array<{ date: string; amount: number }>;
  }> {
    const totalSales = await this.getTotalRevenue();
    const monthlySales = await this.getMonthlySales();
    const salesByPlotSize = await this.getSalesByPlotSize();
    const salesByPaymentType = await this.getSalesByPaymentType();
    const topCustomers = await this.getTopCustomers();
    const conversionRate = await this.getConversionRate();
    const averageDealSize = await this.getAverageDealSize();
    const salesTrend = await this.getSalesTrend();

    return {
      totalSales,
      monthlySales,
      salesByPlotSize,
      salesByPaymentType,
      topCustomers,
      conversionRate,
      averageDealSize,
      salesTrend,
    };
  }

  // Financial Analytics
  async getFinancialAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueByMonth: Array<{ month: string; amount: number }>;
    expensesByMonth: Array<{ month: string; amount: number }>;
    paymentMethods: Array<{ method: string; amount: number; count: number }>;
    overdueAmount: number;
    collectionRate: number;
    cashFlow: Array<{ date: string; inflow: number; outflow: number; balance: number }>;
  }> {
    const totalRevenue = await this.getTotalRevenue();
    const totalExpenses = await this.getTotalExpenses();
    const netProfit = totalRevenue - totalExpenses;

    const revenueByMonth = await this.getRevenueByMonth();
    const expensesByMonth = await this.getExpensesByMonth();
    const paymentMethods = await this.getPaymentMethods();
    const overdueAmount = await this.getOverduePayments();
    const collectionRate = await this.getCollectionRate();
    const cashFlow = await this.getCashFlow();

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueByMonth,
      expensesByMonth,
      paymentMethods,
      overdueAmount,
      collectionRate,
      cashFlow,
    };
  }

  // Customer Analytics
  async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    customerRetention: number;
    averageCustomerValue: number;
    customersBySource: Array<{ source: string; count: number }>;
    customerSatisfaction: number;
    topSpenders: Array<{ customer: string; amount: number }>;
    customerLifetimeValue: number;
  }> {
    const totalCustomers = await this.customerRepository.count();
    const newCustomers = await this.customerRepository.count({
      where: {
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });
    const activeCustomers = await this.customerRepository.count({
      where: {
        bookings: { status: BookingStatus.CONFIRMED }
      }
    });

    const averageCustomerValue = await this.getAverageCustomerValue();
    const customersBySource = await this.getCustomersBySource();
    const topSpenders = await this.getTopSpenders();

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      customerRetention: 85, // Placeholder
      averageCustomerValue,
      customersBySource,
      customerSatisfaction: 4.2, // Placeholder
      topSpenders,
      customerLifetimeValue: averageCustomerValue * 1.5, // Placeholder calculation
    };
  }

  // Helper methods
  private async getTotalRevenue(): Promise<number> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'total')
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getMonthlyRevenue(): Promise<number> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'total')
      .where('booking.createdAt >= :currentMonth', { currentMonth })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getOverduePayments(): Promise<number> {
    // Get overdue payments from installments
    const result = await this.installmentRepository
      .createQueryBuilder('installment')
      .select('SUM(installment.amount)', 'total')
      .where('installment.dueDate < :now', { now: new Date() })
      .andWhere('installment.status = :status', { status: 'pending' })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getRecentActivity(): Promise<any[]> {
    // Get recent bookings, customers, and payments
    const [recentBookings, recentCustomers, recentPayments] = await Promise.all([
      this.bookingRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['customer', 'plot']
      }),
      this.customerRepository.find({
        order: { createdAt: 'DESC' },
        take: 5
      }),
      this.paymentRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['paymentSchedule']
      })
    ]);

    const activities = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        description: `New booking by ${booking.customer?.fullName}`,
        amount: booking.totalAmount,
        createdAt: booking.createdAt
      })),
      ...recentCustomers.map(customer => ({
        type: 'customer',
        description: `New customer: ${customer.fullName}`,
        createdAt: customer.createdAt
      })),
      ...recentPayments.map(payment => ({
        type: 'payment',
        description: `Payment received: ${payment.amount}`,
        amount: payment.amount,
        createdAt: payment.createdAt
      }))
    ];

    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }

  private async getMonthlySales(): Promise<Array<{ month: string; amount: number; count: number }>> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('TO_CHAR(booking.createdAt, \'YYYY-MM\')', 'month')
      .addSelect('SUM(booking.totalAmount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('TO_CHAR(booking.createdAt, \'YYYY-MM\')')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return result.map(row => ({
      month: row.month,
      amount: parseFloat(row.amount) || 0,
      count: parseInt(row.count) || 0
    }));
  }

  private async getSalesByPlotSize(): Promise<Array<{ size: string; amount: number; count: number }>> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.plot', 'plot')
      .select('plot.sizeMarla', 'size')
      .addSelect('SUM(booking.totalAmount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('plot.sizeMarla')
      .orderBy('amount', 'DESC')
      .getRawMany();

    return result.map(row => ({
      size: `${row.size} Marla`,
      amount: parseFloat(row.amount) || 0,
      count: parseInt(row.count) || 0
    }));
  }

  private async getSalesByPaymentType(): Promise<Array<{ type: string; amount: number; count: number }>> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'type')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('payment.paymentMethod')
      .orderBy('amount', 'DESC')
      .getRawMany();

    return result.map(row => ({
      type: row.type,
      amount: parseFloat(row.amount) || 0,
      count: parseInt(row.count) || 0
    }));
  }

  private async getTopCustomers(): Promise<Array<{ customer: string; amount: number; bookings: number }>> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.customer', 'customer')
      .select('customer.fullName', 'customer')
      .addSelect('SUM(booking.totalAmount)', 'amount')
      .addSelect('COUNT(*)', 'bookings')
      .groupBy('customer.id')
      .orderBy('amount', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map(row => ({
      customer: row.customer,
      amount: parseFloat(row.amount) || 0,
      bookings: parseInt(row.bookings) || 0
    }));
  }

  private async getConversionRate(): Promise<number> {
    const [totalLeads, convertedLeads] = await Promise.all([
      this.leadRepository.count(),
      this.leadRepository.count({ where: { status: LeadStatus.CLOSE_WON } })
    ]);
    
    return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  }

  private async getAverageDealSize(): Promise<number> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('AVG(booking.totalAmount)', 'average')
      .getRawOne();
    
    return parseFloat(result.average) || 0;
  }

  private async getSalesTrend(): Promise<Array<{ date: string; amount: number }>> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('TO_CHAR(booking.createdAt, \'YYYY-MM-DD\')', 'date')
      .addSelect('SUM(booking.totalAmount)', 'amount')
      .groupBy('TO_CHAR(booking.createdAt, \'YYYY-MM-DD\')')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return result.map(row => ({
      date: row.date,
      amount: parseFloat(row.amount) || 0
    }));
  }

  // Additional helper methods for financial analytics
  private async getTotalExpenses(): Promise<number> {
    // Placeholder - would need expense tracking
    return 0;
  }

  private async getRevenueByMonth(): Promise<Array<{ month: string; amount: number }>> {
    return this.getMonthlySales();
  }

  private async getExpensesByMonth(): Promise<Array<{ month: string; amount: number }>> {
    // Placeholder
    return [];
  }

  private async getPaymentMethods(): Promise<Array<{ method: string; amount: number; count: number }>> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('SUM(payment.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('payment.paymentMethod')
      .orderBy('amount', 'DESC')
      .getRawMany();

    return result.map(row => ({
      method: row.method,
      amount: parseFloat(row.amount) || 0,
      count: parseInt(row.count) || 0
    }));
  }

  private async getCollectionRate(): Promise<number> {
    const totalAmount = await this.getTotalRevenue();
    const collectedAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();
    
    return totalAmount > 0 ? (parseFloat(collectedAmount.total) / totalAmount) * 100 : 0;
  }

  private async getCashFlow(): Promise<Array<{ date: string; inflow: number; outflow: number; balance: number }>> {
    // Placeholder
    return [];
  }

  private async getAverageCustomerValue(): Promise<number> {
    return this.getAverageDealSize();
  }

  private async getCustomersBySource(): Promise<Array<{ source: string; count: number }>> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.leadSource', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.leadSource')
      .getRawMany();

    return result.map(row => ({
      source: row.source || 'Unknown',
      count: parseInt(row.count) || 0
    }));
  }

  private async getTopSpenders(): Promise<Array<{ customer: string; amount: number }>> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.customer', 'customer')
      .select('customer.fullName', 'customer')
      .addSelect('SUM(booking.totalAmount)', 'amount')
      .groupBy('customer.id')
      .orderBy('amount', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map(row => ({
      customer: row.customer,
      amount: parseFloat(row.amount) || 0
    }));
  }

  // Construction Analytics
  async getConstructionAnalytics(): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    averageProjectDuration: number;
    totalConstructionCost: number;
    costOverrun: number;
    projectsByType: Array<{ type: string; count: number }>;
    projectsByStatus: Array<{ status: string; count: number }>;
    productivityMetrics: Array<{ metric: string; value: number }>;
  }> {
    const totalProjects = await this.projectRepository.count();
    const activeProjects = await this.projectRepository.count({ 
      where: { status: ConstructionStatus.IN_PROGRESS } 
    });
    const completedProjects = await this.projectRepository.count({ 
      where: { status: ConstructionStatus.COMPLETED } 
    });

    // Simplified calculations for now
    const averageProjectDuration = 90; // days
    const totalConstructionCost = 0; // Would need construction expenses tracking
    const costOverrun = 0; // Would need budget vs actual tracking

    const projectsByType = [
      { type: 'Residential', count: Math.floor(totalProjects * 0.7) },
      { type: 'Commercial', count: Math.floor(totalProjects * 0.3) }
    ];

    const projectsByStatus = [
      { status: 'Active', count: activeProjects },
      { status: 'Completed', count: completedProjects },
      { status: 'Planned', count: totalProjects - activeProjects - completedProjects }
    ];

    const productivityMetrics = [
      { metric: 'Completion Rate', value: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0 },
      { metric: 'Active Projects', value: activeProjects },
      { metric: 'Average Duration', value: averageProjectDuration }
    ];

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      averageProjectDuration,
      totalConstructionCost,
      costOverrun,
      projectsByType,
      projectsByStatus,
      productivityMetrics
    };
  }
}