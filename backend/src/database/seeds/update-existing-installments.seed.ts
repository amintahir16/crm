import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

export async function updateExistingInstallments() {
  console.log('🔄 Starting update of existing installments...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    // Get all installments that need updating
    const installmentsToUpdate = await AppDataSource.query(`
      SELECT 
        i.id,
        i.amount,
        i.dueDate,
        i.paymentScheduleId,
        ps.paymentPlanId,
        ps.installmentAmount,
        ps.downPayment,
        ps.startDate,
        pp.monthlyPayment,
        pp.quarterlyPayment,
        pp.biYearlyPayment,
        pp.triannualPayment
      FROM installments i
      JOIN payment_schedules ps ON i.paymentScheduleId = ps.id
      LEFT JOIN payment_plans pp ON ps.paymentPlanId = pp.id
      WHERE i.installmentType IS NULL OR i.description IS NULL
      ORDER BY i.dueDate ASC
    `);

    console.log(`📊 Found ${installmentsToUpdate.length} installments to update`);

    let updatedCount = 0;

    for (const installment of installmentsToUpdate) {
      let installmentType = 'monthly';
      let description = 'Monthly Installment';

      // If there's a payment plan, try to determine the type based on amount
      if (installment.paymentPlanId && installment.monthlyPayment) {
        const amount = parseFloat(installment.amount);
        const monthlyPayment = parseFloat(installment.monthlyPayment);
        const quarterlyPayment = installment.quarterlyPayment ? parseFloat(installment.quarterlyPayment) : 0;
        const biYearlyPayment = installment.biYearlyPayment ? parseFloat(installment.biYearlyPayment) : 0;
        const triannualPayment = installment.triannualPayment ? parseFloat(installment.triannualPayment) : 0;
        const downPayment = parseFloat(installment.downPayment);

        // Check if this is a down payment (first installment and amount doesn't match monthly)
        const startDate = new Date(installment.startDate);
        const dueDate = new Date(installment.dueDate);
        const monthsDiff = (dueDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (dueDate.getMonth() - startDate.getMonth());

        if (monthsDiff <= 1 && Math.abs(amount - downPayment) < Math.abs(amount - monthlyPayment)) {
          installmentType = 'down_payment_balance';
          description = 'Remaining Down Payment';
        }
        // Check for triannual payment (every 4 months)
        else if (triannualPayment > 0 && Math.abs(amount - triannualPayment) < 1000) {
          installmentType = 'triannual';
          description = `Triannual Payment (Month ${monthsDiff + 1})`;
        }
        // Check for bi-yearly payment (every 6 months)
        else if (biYearlyPayment > 0 && Math.abs(amount - biYearlyPayment) < 1000) {
          installmentType = 'bi_yearly';
          description = `Bi-Yearly Payment (Month ${monthsDiff + 1})`;
        }
        // Check for quarterly payment (every 3 months)
        else if (quarterlyPayment > 0 && Math.abs(amount - quarterlyPayment) < 1000) {
          installmentType = 'quarterly';
          description = `Quarterly Payment (Month ${monthsDiff + 1})`;
        }
        // Default to monthly
        else if (Math.abs(amount - monthlyPayment) < 1000) {
          installmentType = 'monthly';
          description = `Monthly Installment ${monthsDiff}`;
        }
      } else {
        // For installments without payment plans, determine by position and amount
        const allInstallmentsForSchedule = installmentsToUpdate.filter(
          inst => inst.paymentScheduleId === installment.paymentScheduleId
        ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        const position = allInstallmentsForSchedule.findIndex(inst => inst.id === installment.id) + 1;
        
        // If it's the first installment and amount is significantly different, it might be down payment
        if (position === 1) {
          const secondInstallment = allInstallmentsForSchedule[1];
          if (secondInstallment && Math.abs(parseFloat(installment.amount) - parseFloat(secondInstallment.amount)) > 10000) {
            installmentType = 'down_payment_balance';
            description = 'Remaining Down Payment';
          } else {
            installmentType = 'monthly';
            description = `Monthly Installment ${position}`;
          }
        } else {
          installmentType = 'monthly';
          description = `Monthly Installment ${position}`;
        }
      }

      // Update the installment
      await AppDataSource.query(`
        UPDATE installments 
        SET installmentType = ?, description = ?
        WHERE id = ?
      `, [installmentType, description, installment.id]);

      updatedCount++;

      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount}/${installmentsToUpdate.length} installments`);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} installments with types and descriptions`);

    // Show summary of updated types
    const typeSummary = await AppDataSource.query(`
      SELECT installmentType, COUNT(*) as count
      FROM installments
      WHERE installmentType IS NOT NULL
      GROUP BY installmentType
      ORDER BY count DESC
    `);

    console.log('📈 Updated installment types summary:');
    typeSummary.forEach((row: any) => {
      console.log(`   ${row.installmentType}: ${row.count} installments`);
    });

  } catch (error) {
    console.error('❌ Error updating existing installments:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateExistingInstallments()
    .then(() => {
      console.log('✅ Installment update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Installment update failed:', error);
      process.exit(1);
    });
}
