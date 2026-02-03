import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentSchedule, PaymentType } from './payment-schedule.entity';
import { InstallmentStatus } from './installment.entity';

@Controller('payment-schedules')
@UseGuards(JwtAuthGuard)
export class PaymentScheduleController {
  constructor(private readonly paymentScheduleService: PaymentScheduleService) {}

  @Get()
  async getAllPaymentSchedules(
    @Query('bookingId') bookingId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Implementation for getting all payment schedules with filters
    return { message: 'Get all payment schedules' };
  }

  @Get(':id')
  async getPaymentScheduleById(@Param('id') id: string) {
    // Implementation for getting a specific payment schedule
    return { message: `Get payment schedule ${id}` };
  }

  @Get('booking/:bookingId')
  async getPaymentSchedulesByBooking(@Param('bookingId') bookingId: string) {
    return await this.paymentScheduleService.getPaymentScheduleByBooking(bookingId);
  }

  @Post()
  async createPaymentSchedule(@Body() createPaymentScheduleDto: {
    bookingId: string;
    paymentType: PaymentType;
    totalAmount: number;
    downPayment: number;
    installmentCount?: number;
    startDate?: Date;
  }) {
    // Implementation for creating a new payment schedule
    return { message: 'Create payment schedule' };
  }

  @Post(':id/payments')
  async recordPayment(
    @Param('id') id: string,
    @Body() paymentDto: {
      amount: number;
      installmentIds?: string[];
      paymentMethod?: string;
      notes?: string;
    },
  ) {
    return await this.paymentScheduleService.recordPayment(
      id,
      paymentDto.amount,
      paymentDto.installmentIds,
    );
  }

  @Put('installments/:installmentId')
  async updateInstallmentStatus(
    @Param('installmentId') installmentId: string,
    @Body() updateDto: {
      status: InstallmentStatus;
      paidDate?: Date;
      lateFee?: number;
    },
  ) {
    return await this.paymentScheduleService.updateInstallmentStatus(
      installmentId,
      updateDto.status,
      updateDto.paidDate,
      updateDto.lateFee,
    );
  }

  @Post(':id/calculate-late-fees')
  async calculateLateFees(@Param('id') id: string) {
    const totalLateFees = await this.paymentScheduleService.calculateLateFees(id);
    return { totalLateFees };
  }

  @Get(':id/installments')
  async getInstallments(@Param('id') id: string) {
    // Implementation for getting installments for a payment schedule
    return { message: `Get installments for payment schedule ${id}` };
  }

  @Get(':id/summary')
  async getPaymentSummary(@Param('id') id: string) {
    // Implementation for getting payment summary
    return { message: `Get payment summary for ${id}` };
  }
}
