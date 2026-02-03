import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlotSizePricing, PlotSizeType } from './plot-size-pricing.entity';

@Injectable()
export class PlotSizePricingService {
  constructor(
    @InjectRepository(PlotSizePricing)
    private plotSizePricingRepository: Repository<PlotSizePricing>,
  ) {}

  async getPricingBySize(sizeMarla: number): Promise<PlotSizePricing | null> {
    // Find the closest size type based on marla
    let sizeType: PlotSizeType;
    
    if (sizeMarla <= 3) {
      sizeType = PlotSizeType.MARLA_3;
    } else if (sizeMarla <= 5) {
      sizeType = PlotSizeType.MARLA_5;
    } else if (sizeMarla <= 7) {
      sizeType = PlotSizeType.MARLA_7;
    } else if (sizeMarla <= 10) {
      sizeType = PlotSizeType.MARLA_10;
    } else if (sizeMarla <= 20) {
      sizeType = PlotSizeType.KANAL_1;
    } else {
      sizeType = PlotSizeType.KANAL_2;
    }

    return await this.plotSizePricingRepository.findOne({
      where: { sizeType, isActive: true },
    });
  }

  async getAllPricing(): Promise<PlotSizePricing[]> {
    return await this.plotSizePricingRepository.find({
      where: { isActive: true },
      order: { sizeMarla: 'ASC' },
    });
  }

  async createPricing(pricingData: Partial<PlotSizePricing>): Promise<PlotSizePricing> {
    const pricing = this.plotSizePricingRepository.create(pricingData);
    return await this.plotSizePricingRepository.save(pricing);
  }

  async updatePricing(id: string, pricingData: Partial<PlotSizePricing>): Promise<PlotSizePricing> {
    await this.plotSizePricingRepository.update(id, pricingData);
    return await this.plotSizePricingRepository.findOne({ where: { id } });
  }

  async deletePricing(id: string): Promise<void> {
    await this.plotSizePricingRepository.update(id, { isActive: false });
  }

  async calculateInstallmentAmount(
    sizeMarla: number,
    totalAmount: number,
    downPaymentPercentage: number,
    installmentCount: number = 24,
  ): Promise<{
    downPayment: number;
    installmentAmount: number;
    totalInstallments: number;
  }> {
    const downPayment = (totalAmount * downPaymentPercentage) / 100;
    const remainingAmount = totalAmount - downPayment;
    const installmentAmount = remainingAmount / installmentCount;

    return {
      downPayment,
      installmentAmount,
      totalInstallments: installmentCount,
    };
  }

  async getDefaultPricing(): Promise<PlotSizePricing[]> {
    // Return default pricing structure for Pakistani housing societies
    const defaultPricing = [
      {
        sizeType: PlotSizeType.MARLA_3,
        sizeMarla: 3,
        sizeSqm: 75.5,
        basePrice: 1500000, // 1.5M PKR
        downPaymentPercentage: 20,
        downPaymentAmount: 300000,
        installmentCount: 24,
        installmentAmount: 50000,
        interestRate: 0,
        lateFeeRate: 2,
        isActive: true,
        description: '3 Marla Plot - Standard pricing',
      },
      {
        sizeType: PlotSizeType.MARLA_5,
        sizeMarla: 5,
        sizeSqm: 125.8,
        basePrice: 2500000, // 2.5M PKR
        downPaymentPercentage: 20,
        downPaymentAmount: 500000,
        installmentCount: 24,
        installmentAmount: 83333,
        interestRate: 0,
        lateFeeRate: 2,
        isActive: true,
        description: '5 Marla Plot - Standard pricing',
      },
      {
        sizeType: PlotSizeType.MARLA_7,
        sizeMarla: 7,
        sizeSqm: 176.1,
        basePrice: 3500000, // 3.5M PKR
        downPaymentPercentage: 20,
        downPaymentAmount: 700000,
        installmentCount: 24,
        installmentAmount: 116667,
        interestRate: 0,
        lateFeeRate: 2,
        isActive: true,
        description: '7 Marla Plot - Standard pricing',
      },
      {
        sizeType: PlotSizeType.MARLA_10,
        sizeMarla: 10,
        sizeSqm: 251.6,
        basePrice: 5000000, // 5M PKR
        downPaymentPercentage: 20,
        downPaymentAmount: 1000000,
        installmentCount: 24,
        installmentAmount: 166667,
        interestRate: 0,
        lateFeeRate: 2,
        isActive: true,
        description: '10 Marla Plot - Standard pricing',
      },
      {
        sizeType: PlotSizeType.KANAL_1,
        sizeMarla: 20,
        sizeSqm: 503.2,
        basePrice: 10000000, // 10M PKR
        downPaymentPercentage: 20,
        downPaymentAmount: 2000000,
        installmentCount: 24,
        installmentAmount: 333333,
        interestRate: 0,
        lateFeeRate: 2,
        isActive: true,
        description: '1 Kanal Plot - Premium pricing',
      },
    ];

    return defaultPricing as PlotSizePricing[];
  }
}
