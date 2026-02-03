import { DataSource } from 'typeorm';
import { Booking } from '../../bookings/booking.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../finance/payment.entity';
import { PaymentSchedule } from '../../finance/payment-schedule.entity';

export async function fixExistingPayments(dataSource: DataSource) {
  const bookingRepository = dataSource.getRepository(Booking);
  const paymentRepository = dataSource.getRepository(Payment);
  const paymentScheduleRepository = dataSource.getRepository(PaymentSchedule);

  console.log('Fixing existing bookings without payment records...');

  // Find all bookings with paid amounts but no corresponding payment records
  const bookingsWithPaidAmounts = await bookingRepository
    .createQueryBuilder('booking')
    .where('booking.paidAmount > 0')
    .getMany();

  console.log(`Found ${bookingsWithPaidAmounts.length} bookings with paid amounts`);

  for (const booking of bookingsWithPaidAmounts) {
    // Check if payment records already exist for this booking
    const paymentSchedule = await paymentScheduleRepository.findOne({
      where: { bookingId: booking.id },
      order: { createdAt: 'DESC' },
    });

    if (!paymentSchedule) {
      console.log(`No payment schedule found for booking ${booking.id}, skipping...`);
      continue;
    }

    const existingPayments = await paymentRepository.find({
      where: { paymentScheduleId: paymentSchedule.id },
    });

    const totalExistingPayments = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // If there's a discrepancy between booking.paidAmount and sum of payment records
    const missingPaymentAmount = booking.paidAmount - totalExistingPayments;

    if (missingPaymentAmount > 0) {
      console.log(`Creating missing payment record for booking ${booking.id}, amount: ${missingPaymentAmount}`);

      const missingPayment = paymentRepository.create({
        paymentScheduleId: paymentSchedule.id,
        amount: missingPaymentAmount,
        paymentDate: booking.bookingDate || booking.createdAt,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        transactionId: `MIGRATION-${booking.id}-${Date.now()}`,
        notes: 'Historical payment record created during data migration to match booking paid amount',
      });

      await paymentRepository.save(missingPayment);
      console.log(`Created payment record for booking ${booking.id}`);
    } else if (missingPaymentAmount < 0) {
      console.log(`Warning: Booking ${booking.id} has more payment records than paidAmount. Manual review needed.`);
    } else {
      console.log(`Booking ${booking.id} already has matching payment records`);
    }
  }

  console.log('Finished fixing existing payment records');
}

// Run the fix if this file is executed directly
if (require.main === module) {
  import('../data-source').then(({ AppDataSource }) => {
    AppDataSource.initialize().then(async () => {
      await fixExistingPayments(AppDataSource);
      await AppDataSource.destroy();
    });
  });
}
