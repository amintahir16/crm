import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between, IsNull } from 'typeorm';
import { Plot, PlotStatus } from '../plots/plot.entity';
import { Customer } from '../customers/customer.entity';
import { Booking } from '../bookings/booking.entity';
import { Installment, InstallmentStatus } from '../finance/installment.entity';
import { ConstructionProject, ConstructionStatus } from '../construction/construction-project.entity';
import { Document, DocumentStatus } from '../documents/document.entity';
import { Message } from '../communication/message.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(ConstructionProject)
    private constructionProjectRepository: Repository<ConstructionProject>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req) {
    const [
      totalPlots,
      soldPlots,
      availablePlots,
      totalCustomers,
      totalBookings,
      overdueInstallments,
      activeProjects,
      completedProjects,
      pendingDocuments,
      unreadMessages,
    ] = await Promise.all([
      this.plotRepository.count(),
      this.plotRepository.count({ where: { status: PlotStatus.SOLD } }),
      this.plotRepository.count({ where: { status: PlotStatus.AVAILABLE } }),
      this.customerRepository.count(),
      this.bookingRepository.count(),
      this.installmentRepository.count({
        where: {
          dueDate: LessThan(new Date()),
          status: InstallmentStatus.PENDING,
        },
      }),
      this.constructionProjectRepository.count({ where: { status: ConstructionStatus.IN_PROGRESS } }),
      this.constructionProjectRepository.count({ where: { status: ConstructionStatus.COMPLETED } }),
      this.documentRepository.count({ where: { status: DocumentStatus.PENDING_REVIEW } }),
      this.messageRepository.count({ where: { readAt: IsNull() } }),
    ]);

    // Calculate total revenue from bookings
    const bookings = await this.bookingRepository.find();
    const totalRevenue = bookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);

    // Calculate pending receivables from booking pending amounts
    const pendingReceivables = bookings.reduce((sum, booking) => sum + (booking.pendingAmount || 0), 0);

    // Calculate monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthlyBookings = await this.bookingRepository.find({
      where: {
        createdAt: LessThan(new Date()),
      },
    });
    const monthlyRevenue = monthlyBookings
      .filter(booking => booking.createdAt >= currentMonth)
      .reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);

    // Calculate quarterly growth (simplified calculation)
    const quarterlyGrowth = this.calculateQuarterlyGrowth(monthlyRevenue, totalRevenue);

    // Calculate customer satisfaction (simplified - based on completed bookings vs total)
    // Cap at 100% to prevent UI issues
    const customerSatisfaction = totalBookings > 0 
      ? Math.min(100, Math.round((soldPlots / totalBookings) * 100)) 
      : 0;

    // System alerts (overdue payments + pending documents)
    const systemAlerts = overdueInstallments + pendingDocuments;

    return {
      stats: {
        totalPlots,
        soldPlots,
        availablePlots,
        totalRevenue,
        pendingReceivables,
        totalCustomers,
        totalBookings,
        overdueInstallments,
        activeProjects,
        completedProjects,
        pendingDocuments,
        unreadMessages,
        monthlyRevenue,
        quarterlyGrowth,
        customerSatisfaction,
        systemAlerts,
      },
      salesTrend: await this.getSalesTrend(),
      revenueDistribution: await this.getRevenueDistribution(bookings),
      recentActivities: await this.getRecentActivities(),
    };
  }

  private calculateQuarterlyGrowth(monthlyRevenue: number, totalRevenue: number): number {
    if (totalRevenue === 0) return 0;
    // Simplified calculation: monthly revenue as percentage of total
    return Math.round((monthlyRevenue / totalRevenue) * 100);
  }

  private async getRecentActivities() {
    // Get recent bookings
    const recentBookings = await this.bookingRepository.find({
      relations: ['customer', 'plot'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      title: `New booking for ${booking.customer?.fullName || 'Unknown'}`,
      description: `Plot ${booking.plot?.plotNumber || 'Unknown'} booked`,
      timestamp: booking.createdAt,
      amount: Number(booking.totalAmount) || 0,
    }));
  }

  private async getSalesTrend(): Promise<Array<{ month: string; bookings: number; revenue: number }>> {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthBookings = await this.bookingRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
      });

      const monthLabel = startDate.toLocaleString('default', { month: 'short' });
      const revenue = monthBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      months.push({
        month: monthLabel,
        bookings: monthBookings.length,
        revenue,
      });
    }

    return months;
  }

  private async getRevenueDistribution(bookings: any[]): Promise<{
    collected: number;
    pending: number;
    overdue: number;
  }> {
    // Collected = sum of all completed payments
    const completedPayments = await this.paymentRepository.find({
      where: { status: PaymentStatus.COMPLETED },
    });
    const collected = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Total expected
    const totalExpected = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    // Overdue installments amount
    const overdueInstallments = await this.installmentRepository.find({
      where: {
        dueDate: LessThan(new Date()),
        status: InstallmentStatus.PENDING,
      },
    });
    const overdue = overdueInstallments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // Pending = total - collected - overdue
    const pending = Math.max(0, totalExpected - collected - overdue);

    return { collected, pending, overdue };
  }
} 