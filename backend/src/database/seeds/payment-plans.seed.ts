import { DataSource } from 'typeorm';
import { PaymentPlan, PaymentPlanStatus } from '../../finance/payment-plan.entity';

export async function seedPaymentPlans(dataSource: DataSource) {
  const paymentPlanRepository = dataSource.getRepository(PaymentPlan);

  // Check if payment plans already exist (skip check to force re-seeding)
  const existingPlans = await paymentPlanRepository.count();
  console.log(`Found ${existingPlans} existing payment plans`);
  
  // Only seed if we have less than 5 plans (to avoid duplicating our mock data)
  if (existingPlans >= 5) {
    console.log('Payment plans already seeded (5 or more plans exist)');
    return;
  }

  const paymentPlans = [
    // 3 Marla Plans
    {
      name: '3 Marla Standard Plan',
      description: 'Standard payment plan for 3 marla plots with monthly installments',
      plotSizeMarla: 3,
      plotPrice: 1500000, // 15 Lakh
      downPaymentPercentage: 20, // 20% = 3 Lakh
      monthlyPayment: 52000, // Remaining 12 Lakh / 24 months = 50k + buffer
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Popular choice for small families'
    },
    {
      name: '3 Marla Quarterly Plan',
      description: '3 marla plots with quarterly payments for easier management',
      plotSizeMarla: 3,
      plotPrice: 1500000,
      downPaymentAmount: 300000, // Fixed 3 Lakh down payment
      monthlyPayment: 25000, // Lower monthly
      quarterlyPayment: 150000, // Higher quarterly to compensate
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Good for quarterly income earners'
    },

    // 5 Marla Plans
    {
      name: '5 Marla Premium Plan',
      description: 'Premium payment plan for 5 marla plots with flexible options',
      plotSizeMarla: 5,
      plotPrice: 2500000, // 25 Lakh
      downPaymentPercentage: 25, // 25% = 6.25 Lakh
      monthlyPayment: 78000, // Remaining 18.75 Lakh / 24 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Most popular plan for medium-sized plots'
    },
    {
      name: '5 Marla Extended Plan',
      description: '5 marla plots with extended tenure for lower monthly payments',
      plotSizeMarla: 5,
      plotPrice: 2500000,
      downPaymentAmount: 500000, // Fixed 5 Lakh down payment
      monthlyPayment: 55000, // Lower monthly due to extended tenure
      tenureMonths: 36, // 3 years
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Extended payment period for affordability'
    },
    {
      name: '5 Marla Bi-yearly Plan',
      description: '5 marla plots with bi-yearly bonus payments',
      plotSizeMarla: 5,
      plotPrice: 2500000,
      downPaymentPercentage: 20, // 5 Lakh
      monthlyPayment: 50000,
      biYearlyPayment: 200000, // Every 6 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Suitable for business owners with bi-yearly bonuses'
    },

    // 7 Marla Plans
    {
      name: '7 Marla Deluxe Plan',
      description: 'Deluxe payment plan for 7 marla plots',
      plotSizeMarla: 7,
      plotPrice: 3500000, // 35 Lakh
      downPaymentPercentage: 30, // 30% = 10.5 Lakh
      monthlyPayment: 102000, // Remaining 24.5 Lakh / 24 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Premium location with higher down payment'
    },
    {
      name: '7 Marla Triannual Plan',
      description: '7 marla plots with triannual payments (3 times per year)',
      plotSizeMarla: 7,
      plotPrice: 3500000,
      downPaymentAmount: 700000, // Fixed 7 Lakh
      monthlyPayment: 60000,
      triannualPayment: 300000, // Every 4 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Perfect for professionals with quarterly bonuses'
    },

    // 10 Marla Plans
    {
      name: '10 Marla Executive Plan',
      description: 'Executive payment plan for 10 marla plots',
      plotSizeMarla: 10,
      plotPrice: 5000000, // 50 Lakh
      downPaymentPercentage: 25, // 25% = 12.5 Lakh
      monthlyPayment: 156000, // Remaining 37.5 Lakh / 24 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Executive class plots with premium amenities'
    },
    {
      name: '10 Marla Flexible Plan',
      description: '10 marla plots with flexible payment structure',
      plotSizeMarla: 10,
      plotPrice: 5000000,
      downPaymentAmount: 1000000, // Fixed 10 Lakh
      monthlyPayment: 80000,
      quarterlyPayment: 400000, // Every 3 months
      tenureMonths: 30, // 2.5 years
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Flexible structure for varying income patterns'
    },

    // 1 Kanal Plans
    {
      name: '1 Kanal Luxury Plan',
      description: 'Luxury payment plan for 1 kanal (20 marla) plots',
      plotSizeMarla: 20,
      plotPrice: 10000000, // 1 Crore
      downPaymentPercentage: 30, // 30% = 30 Lakh
      monthlyPayment: 292000, // Remaining 70 Lakh / 24 months
      tenureMonths: 24,
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Premium luxury plots with exclusive amenities'
    },
    {
      name: '1 Kanal Extended Luxury',
      description: '1 kanal plots with extended payment period',
      plotSizeMarla: 20,
      plotPrice: 10000000,
      downPaymentAmount: 2000000, // Fixed 20 Lakh
      monthlyPayment: 180000,
      biYearlyPayment: 500000, // Every 6 months
      tenureMonths: 36, // 3 years
      status: PaymentPlanStatus.ACTIVE,
      notes: 'Extended luxury plan with manageable payments'
    }
  ];

  console.log('Seeding payment plans...');
  
  for (const planData of paymentPlans) {
    const plan = paymentPlanRepository.create(planData);
    await paymentPlanRepository.save(plan);
    console.log(`Created payment plan: ${planData.name}`);
  }

  console.log(`Successfully seeded ${paymentPlans.length} payment plans`);
}
