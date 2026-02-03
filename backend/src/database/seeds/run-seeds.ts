import { AppDataSource } from '../data-source';
import { seedPaymentPlans } from './payment-plans.seed';
import { fixExistingPayments } from './fix-existing-payments.seed';
import { updateExistingInstallments } from './update-existing-installments.seed';
import { seedSalesTeamLeads } from './seed-sales-team-leads';
import { seedRealisticCRMData } from './seed-realistic-crm-data';
import { seedDailySalesActivities } from './seed-daily-sales-activities';

async function runSeeds() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run all seeds
    await seedPaymentPlans(AppDataSource);
    
    // Fix existing payment records
    await fixExistingPayments(AppDataSource);
    
    // Update existing installments with types and descriptions
    await updateExistingInstallments();
    
    // Seed sales team leads
    await seedSalesTeamLeads(AppDataSource);
    
    // Seed realistic CRM data
    await seedRealisticCRMData(AppDataSource);
    
    // Seed daily sales activities
    await seedDailySalesActivities(AppDataSource);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
