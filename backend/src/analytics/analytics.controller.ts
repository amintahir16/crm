import { 
  Controller, 
  Get, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
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
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('sales')
  async getSalesAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalSales: number;
    monthlySales: Array<{ month: string; amount: number; count: number }>;
    salesByPlotSize: Array<{ size: string; amount: number; count: number }>;
    salesByPaymentType: Array<{ type: string; amount: number; count: number }>;
    topCustomers: Array<{ customer: string; amount: number; bookings: number }>;
    conversionRate: number;
    averageDealSize: number;
    salesTrend: Array<{ date: string; amount: number }>;
  }> {
    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    return this.analyticsService.getSalesAnalytics(dateRange);
  }

  @Get('financial')
  async getFinancialAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
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
    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    return this.analyticsService.getFinancialAnalytics(dateRange);
  }

  @Get('customers')
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
    return this.analyticsService.getCustomerAnalytics();
  }

  @Get('construction')
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
    return this.analyticsService.getConstructionAnalytics();
  }
}
