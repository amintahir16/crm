import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

export async function createTestBookingWithPaymentPlan() {
  console.log('🔄 Creating test booking with payment plan...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    // Get a payment plan with multiple payment types
    const paymentPlan = await AppDataSource.query(`
      SELECT * FROM payment_plans 
      WHERE (quarterlyPayment IS NOT NULL AND quarterlyPayment > 0) 
         OR (biYearlyPayment IS NOT NULL AND biYearlyPayment > 0) 
         OR (triannualPayment IS NOT NULL AND triannualPayment > 0)
      LIMIT 1
    `);

    if (!paymentPlan || paymentPlan.length === 0) {
      console.log('❌ No payment plan with multiple payment types found');
      return;
    }

    const plan = paymentPlan[0];
    console.log(`📋 Using payment plan: ${plan.name} (${plan.plotSizeMarla} Marla)`);

    // Get a customer and plot
    const customer = await AppDataSource.query('SELECT * FROM customers LIMIT 1');
    const plot = await AppDataSource.query('SELECT * FROM plots WHERE status = "available" LIMIT 1');

    if (!customer || customer.length === 0 || !plot || plot.length === 0) {
      console.log('❌ No available customer or plot found');
      return;
    }

    // Create booking with partial down payment
    const bookingId = `test-booking-${Date.now()}`;
    const totalAmount = plan.plotPrice;
    const requiredDownPayment = plan.downPaymentAmount || (plan.plotPrice * (plan.downPaymentPercentage / 100));
    const initialPayment = Math.floor(requiredDownPayment * 0.6); // Pay 60% of down payment initially
    const pendingAmount = totalAmount - initialPayment;

    // Create booking
    await AppDataSource.query(`
      INSERT INTO bookings (
        id, customerId, plotId, createdById, downPayment, totalAmount, 
        paidAmount, pendingAmount, status, bookingDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', datetime('now'), datetime('now'), datetime('now'))
    `, [
      bookingId,
      customer[0].id,
      plot[0].id,
      customer[0].id, // Using customer as creator for simplicity
      requiredDownPayment,
      totalAmount,
      initialPayment,
      pendingAmount
    ]);

    console.log(`✅ Created booking: ${bookingId}`);
    console.log(`   Total Amount: PKR ${totalAmount.toLocaleString()}`);
    console.log(`   Required Down Payment: PKR ${requiredDownPayment.toLocaleString()}`);
    console.log(`   Initial Payment: PKR ${initialPayment.toLocaleString()}`);
    console.log(`   Remaining Down Payment: PKR ${(requiredDownPayment - initialPayment).toLocaleString()}`);

    // Update plot status
    await AppDataSource.query('UPDATE plots SET status = "reserved" WHERE id = ?', [plot[0].id]);

    console.log('🎉 Test booking created successfully!');
    console.log(`📱 View at: http://localhost:3000/dashboard/bookings/view/${bookingId}`);

  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTestBookingWithPaymentPlan()
    .then(() => {
      console.log('✅ Test booking creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test booking creation failed:', error);
      process.exit(1);
    });
}
