import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlotSizePricingService } from './plot-size-pricing.service';
import { PlotSizePricing } from './plot-size-pricing.entity';

@Controller('plot-size-pricing')
@UseGuards(JwtAuthGuard)
export class PlotSizePricingController {
  constructor(private readonly plotSizePricingService: PlotSizePricingService) {}

  @Get()
  async getAllPricing() {
    return await this.plotSizePricingService.getAllPricing();
  }

  @Get('size/:sizeMarla')
  async getPricingBySize(@Param('sizeMarla') sizeMarla: string) {
    const size = parseFloat(sizeMarla);
    return await this.plotSizePricingService.getPricingBySize(size);
  }

  @Get('calculate/:sizeMarla')
  async calculateInstallmentAmount(
    @Param('sizeMarla') sizeMarla: string,
    @Query('totalAmount') totalAmount?: string,
    @Query('downPaymentPercentage') downPaymentPercentage?: string,
    @Query('installmentCount') installmentCount?: string,
  ) {
    const size = parseFloat(sizeMarla);
    const total = totalAmount ? parseFloat(totalAmount) : 0;
    const downPaymentPct = downPaymentPercentage ? parseFloat(downPaymentPercentage) : 20;
    const installments = installmentCount ? parseInt(installmentCount) : 24;

    return await this.plotSizePricingService.calculateInstallmentAmount(
      size,
      total,
      downPaymentPct,
      installments,
    );
  }

  @Post()
  async createPricing(@Body() pricingData: Partial<PlotSizePricing>) {
    return await this.plotSizePricingService.createPricing(pricingData);
  }

  @Put(':id')
  async updatePricing(@Param('id') id: string, @Body() pricingData: Partial<PlotSizePricing>) {
    return await this.plotSizePricingService.updatePricing(id, pricingData);
  }

  @Delete(':id')
  async deletePricing(@Param('id') id: string) {
    await this.plotSizePricingService.deletePricing(id);
    return { message: 'Pricing deleted successfully' };
  }

  @Post('initialize-defaults')
  async initializeDefaultPricing() {
    const defaultPricing = await this.plotSizePricingService.getDefaultPricing();
    const results = [];
    
    for (const pricing of defaultPricing) {
      const result = await this.plotSizePricingService.createPricing(pricing);
      results.push(result);
    }
    
    return { message: 'Default pricing initialized', results };
  }
}
