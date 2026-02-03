import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { User } from '../users/user.entity';
import { GetUser } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async getAllPayments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.paymentService.getAllPayments({
      page: Number(page),
      limit: Number(limit),
      status,
      method,
    });
  }

  @Post()
  async createPayment(
    @Body() createPaymentDto: {
      paymentScheduleId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      referenceNumber?: string;
      bankName?: string;
      accountNumber?: string;
      chequeNumber?: string;
      chequeDate?: string;
      cardLastFour?: string;
      walletProvider?: string;
      notes?: string;
    },
    @GetUser() user: User,
  ): Promise<Payment> {
    return this.paymentService.createPayment(
      createPaymentDto.paymentScheduleId,
      createPaymentDto.amount,
      createPaymentDto.paymentMethod,
      {
        transactionId: createPaymentDto.transactionId,
        referenceNumber: createPaymentDto.referenceNumber,
        bankName: createPaymentDto.bankName,
        accountNumber: createPaymentDto.accountNumber,
        chequeNumber: createPaymentDto.chequeNumber,
        chequeDate: createPaymentDto.chequeDate ? new Date(createPaymentDto.chequeDate) : undefined,
        cardLastFour: createPaymentDto.cardLastFour,
        walletProvider: createPaymentDto.walletProvider,
        notes: createPaymentDto.notes,
      },
      user.id,
    );
  }

  @Put(':id/process')
  async processPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() processPaymentDto: {
      approved: boolean;
      rejectionReason?: string;
    },
    @GetUser() user: User,
  ): Promise<Payment> {
    return this.paymentService.processPayment(
      paymentId,
      user.id,
      processPaymentDto.approved,
      processPaymentDto.rejectionReason,
    );
  }

  @Get('schedule/:paymentScheduleId')
  async getPaymentsBySchedule(
    @Param('paymentScheduleId', ParseUUIDPipe) paymentScheduleId: string,
  ): Promise<Payment[]> {
    return this.paymentService.getPaymentsBySchedule(paymentScheduleId);
  }

  @Get('booking/:bookingId')
  async getPaymentsByBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<Payment[]> {
    return this.paymentService.getPaymentsByBooking(bookingId);
  }

  @Get('booking/:bookingId/summary')
  async getPaymentSummary(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<{
    totalPaid: number;
    totalPending: number;
    lastPaymentDate: Date | null;
    nextDueDate: Date | null;
    overdueAmount: number;
  }> {
    return this.paymentService.getPaymentSummary(bookingId);
  }

  @Post(':id/refund')
  async refundPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() refundDto: {
      refundAmount: number;
      reason: string;
    },
    @GetUser() user: User,
  ): Promise<Payment> {
    return this.paymentService.refundPayment(
      paymentId,
      refundDto.refundAmount,
      refundDto.reason,
      user.id,
    );
  }

  @Get('analytics')
  async getPaymentAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalPayments: number;
    totalAmount: number;
    byMethod: Record<PaymentMethod, { count: number; amount: number }>;
    byStatus: Record<PaymentStatus, { count: number; amount: number }>;
    dailyPayments: Array<{ date: string; count: number; amount: number }>;
  }> {
    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    return this.paymentService.getPaymentAnalytics(dateRange);
  }
}
