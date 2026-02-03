import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PaymentPlanService, CreatePaymentPlanDto, UpdatePaymentPlanDto } from './payment-plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';

@Controller('payment-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentPlanController {
  constructor(private readonly paymentPlanService: PaymentPlanService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_PAYMENT_PLANS)
  async create(@Body() createPaymentPlanDto: CreatePaymentPlanDto) {
    return await this.paymentPlanService.create(createPaymentPlanDto);
  }

  @Get()
  async findAll() {
    return await this.paymentPlanService.findAll();
  }

  @Get('active')
  async findActive() {
    return await this.paymentPlanService.findActive();
  }

  @Get('by-plot-size')
  async findByPlotSize(@Query('plotSizeMarla') plotSizeMarla: number) {
    return await this.paymentPlanService.findByPlotSize(plotSizeMarla);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.paymentPlanService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_PAYMENT_PLANS)
  async update(@Param('id') id: string, @Body() updatePaymentPlanDto: UpdatePaymentPlanDto) {
    return await this.paymentPlanService.update(id, updatePaymentPlanDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_PAYMENT_PLANS)
  async remove(@Param('id') id: string) {
    return await this.paymentPlanService.remove(id);
  }

  @Post(':id/validate')
  async validatePaymentPlan(@Param('id') id: string) {
    const paymentPlan = await this.paymentPlanService.findOne(id);
    const isValid = await this.paymentPlanService.validatePaymentPlan(paymentPlan);
    return { isValid };
  }
}
