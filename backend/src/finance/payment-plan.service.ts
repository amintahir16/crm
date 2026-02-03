import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentPlan, PaymentPlanStatus } from './payment-plan.entity';

export interface CreatePaymentPlanDto {
  name: string;
  description: string;
  plotSizeMarla: number;
  plotPrice: number;
  downPaymentAmount?: number;
  downPaymentPercentage?: number;
  monthlyPayment: number;
  quarterlyPayment?: number;
  biYearlyPayment?: number;
  triannualPayment?: number;
  tenureMonths?: number;
  notes?: string;
}

export interface UpdatePaymentPlanDto extends Partial<CreatePaymentPlanDto> {
  status?: PaymentPlanStatus;
}

@Injectable()
export class PaymentPlanService {
  constructor(
    @InjectRepository(PaymentPlan)
    private paymentPlanRepository: Repository<PaymentPlan>,
  ) {}

  async create(createPaymentPlanDto: CreatePaymentPlanDto): Promise<PaymentPlan> {
    // Validate that only one additional payment type is selected
    this.validateAdditionalPayments(createPaymentPlanDto);
    
    // Validate payment plan calculations
    await this.validatePaymentCalculations(createPaymentPlanDto);

    const paymentPlan = this.paymentPlanRepository.create({
      ...createPaymentPlanDto,
      tenureMonths: createPaymentPlanDto.tenureMonths || 24,
    });

    return await this.paymentPlanRepository.save(paymentPlan);
  }

  async findAll(): Promise<PaymentPlan[]> {
    return await this.paymentPlanRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<PaymentPlan[]> {
    return await this.paymentPlanRepository.find({
      where: { status: PaymentPlanStatus.ACTIVE },
      order: { plotSizeMarla: 'ASC' },
    });
  }

  async findByPlotSize(plotSizeMarla: number): Promise<PaymentPlan[]> {
    return await this.paymentPlanRepository.find({
      where: { 
        plotSizeMarla,
        status: PaymentPlanStatus.ACTIVE 
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PaymentPlan> {
    const paymentPlan = await this.paymentPlanRepository.findOne({
      where: { id },
    });

    if (!paymentPlan) {
      throw new NotFoundException('Payment plan not found');
    }

    return paymentPlan;
  }

  async update(id: string, updatePaymentPlanDto: UpdatePaymentPlanDto): Promise<PaymentPlan> {
    const paymentPlan = await this.findOne(id);
    
    // Merge existing data with updates for validation
    const updatedData = { ...paymentPlan, ...updatePaymentPlanDto };
    
    // Validate additional payments
    this.validateAdditionalPayments(updatedData);
    
    // Validate payment calculations if any payment-related fields are being updated
    const paymentFields = ['plotPrice', 'downPaymentAmount', 'downPaymentPercentage', 
                          'monthlyPayment', 'quarterlyPayment', 'biYearlyPayment', 
                          'triannualPayment', 'tenureMonths'];
    
    const hasPaymentUpdates = paymentFields.some(field => updatePaymentPlanDto[field] !== undefined);
    
    if (hasPaymentUpdates) {
      await this.validatePaymentCalculations(updatedData);
    }
    
    Object.assign(paymentPlan, updatePaymentPlanDto);
    
    return await this.paymentPlanRepository.save(paymentPlan);
  }

  async remove(id: string): Promise<void> {
    const paymentPlan = await this.findOne(id);
    await this.paymentPlanRepository.remove(paymentPlan);
  }

  async calculateDownPayment(paymentPlan: PaymentPlan): Promise<number> {
    if (paymentPlan.downPaymentAmount) {
      return paymentPlan.downPaymentAmount;
    } else if (paymentPlan.downPaymentPercentage) {
      return (paymentPlan.plotPrice * paymentPlan.downPaymentPercentage) / 100;
    }
    return 0;
  }

  async calculateRemainingAmount(paymentPlan: PaymentPlan, downPayment: number): Promise<number> {
    return paymentPlan.plotPrice - downPayment;
  }

  private validateAdditionalPayments(paymentData: any): void {
    const additionalPayments = [
      paymentData.quarterlyPayment,
      paymentData.biYearlyPayment,
      paymentData.triannualPayment
    ].filter(payment => payment && payment > 0);

    if (additionalPayments.length > 1) {
      throw new Error('Only one additional payment type (quarterly, bi-yearly, or triannual) can be selected per plan');
    }
  }

  private async validatePaymentCalculations(paymentData: any): Promise<void> {
    const errors: string[] = [];

    // Validate basic required fields
    if (!paymentData.plotPrice || paymentData.plotPrice <= 0) {
      errors.push('Plot price must be greater than 0');
    }

    if (!paymentData.monthlyPayment || paymentData.monthlyPayment <= 0) {
      errors.push('Monthly payment must be greater than 0');
    }

    if (!paymentData.tenureMonths || paymentData.tenureMonths <= 0) {
      errors.push('Tenure must be greater than 0 months');
    }

    // Validate down payment
    const downPayment = this.calculateDownPaymentAmount(paymentData);
    if (downPayment <= 0) {
      errors.push('Down payment must be greater than 0. Specify either downPaymentAmount or downPaymentPercentage');
    }

    if (downPayment >= paymentData.plotPrice) {
      errors.push('Down payment cannot be equal to or greater than plot price');
    }

    // Validate down payment percentage if specified
    if (paymentData.downPaymentPercentage) {
      if (paymentData.downPaymentPercentage < 0 || paymentData.downPaymentPercentage > 100) {
        errors.push('Down payment percentage must be between 0 and 100');
      }
    }

    // Calculate remaining amount after down payment
    const remainingAmount = paymentData.plotPrice - downPayment;

    // Calculate total payments over tenure
    const totalMonthlyPayments = paymentData.monthlyPayment * paymentData.tenureMonths;
    let totalAdditionalPayments = 0;

    // Calculate additional payments
    if (paymentData.quarterlyPayment) {
      const quarterlyCount = Math.floor(paymentData.tenureMonths / 3);
      totalAdditionalPayments += paymentData.quarterlyPayment * quarterlyCount;
    }

    if (paymentData.biYearlyPayment) {
      const biYearlyCount = Math.floor(paymentData.tenureMonths / 6);
      totalAdditionalPayments += paymentData.biYearlyPayment * biYearlyCount;
    }

    if (paymentData.triannualPayment) {
      const triannualCount = Math.floor(paymentData.tenureMonths / 4);
      totalAdditionalPayments += paymentData.triannualPayment * triannualCount;
    }

    const totalInstallmentPayments = totalMonthlyPayments + totalAdditionalPayments;
    const totalPayments = downPayment + totalInstallmentPayments;

    // Validate that total payments cover the plot price
    const tolerance = 1000; // Allow 1000 PKR tolerance for rounding
    if (totalPayments < (paymentData.plotPrice - tolerance)) {
      errors.push(
        `Total payments (${totalPayments.toLocaleString()}) are insufficient to cover plot price (${paymentData.plotPrice.toLocaleString()}). ` +
        `Shortfall: ${(paymentData.plotPrice - totalPayments).toLocaleString()} PKR`
      );
    }

    // Warn if overpayment is significant (more than 5% over plot price)
    const overpaymentThreshold = paymentData.plotPrice * 1.05;
    if (totalPayments > overpaymentThreshold) {
      errors.push(
        `Total payments (${totalPayments.toLocaleString()}) exceed plot price by more than 5%. ` +
        `Overpayment: ${(totalPayments - paymentData.plotPrice).toLocaleString()} PKR`
      );
    }

    // Validate individual payment amounts are reasonable
    if (paymentData.monthlyPayment > (remainingAmount / 2)) {
      errors.push('Monthly payment seems too high compared to remaining amount after down payment');
    }

    if (paymentData.quarterlyPayment && paymentData.quarterlyPayment > (remainingAmount / 4)) {
      errors.push('Quarterly payment seems too high compared to remaining amount');
    }

    if (paymentData.biYearlyPayment && paymentData.biYearlyPayment > (remainingAmount / 2)) {
      errors.push('Bi-yearly payment seems too high compared to remaining amount');
    }

    if (paymentData.triannualPayment && paymentData.triannualPayment > (remainingAmount / 3)) {
      errors.push('Triannual payment seems too high compared to remaining amount');
    }

    if (errors.length > 0) {
      throw new Error(`Payment plan validation failed: ${errors.join('; ')}`);
    }
  }

  private calculateDownPaymentAmount(paymentData: any): number {
    if (paymentData.downPaymentAmount) {
      return paymentData.downPaymentAmount;
    }
    
    if (paymentData.downPaymentPercentage && paymentData.plotPrice) {
      return Math.round((paymentData.plotPrice * paymentData.downPaymentPercentage) / 100);
    }
    
    return 0;
  }

  async validatePaymentPlan(paymentPlan: PaymentPlan): Promise<boolean> {
    const downPayment = await this.calculateDownPayment(paymentPlan);
    const remainingAmount = await this.calculateRemainingAmount(paymentPlan, downPayment);
    
    // Check if monthly payments can cover the remaining amount within tenure
    const totalMonthlyPayments = paymentPlan.monthlyPayment * paymentPlan.tenureMonths;
    
    // Add additional payments if they exist (only one type should be active)
    let totalAdditionalPayments = 0;
    if (paymentPlan.quarterlyPayment) {
      const quarterlyCount = Math.floor(paymentPlan.tenureMonths / 3);
      totalAdditionalPayments += paymentPlan.quarterlyPayment * quarterlyCount;
    }
    
    if (paymentPlan.biYearlyPayment) {
      const biYearlyCount = Math.floor(paymentPlan.tenureMonths / 6);
      totalAdditionalPayments += paymentPlan.biYearlyPayment * biYearlyCount;
    }

    if (paymentPlan.triannualPayment) {
      const triannualCount = Math.floor(paymentPlan.tenureMonths / 4);
      totalAdditionalPayments += paymentPlan.triannualPayment * triannualCount;
    }
    
    const totalPayments = totalMonthlyPayments + totalAdditionalPayments;
    
    return totalPayments >= remainingAmount;
  }
}
