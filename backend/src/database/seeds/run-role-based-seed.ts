import { DataSource } from 'typeorm';
import { User } from '../../users/user.entity';
import { SalesActivity } from '../../users/sales-activity.entity';
import { createRoleBasedUsers } from './create-role-based-users';

// Database configuration
const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'queen-hills.db',
  entities: [User, SalesActivity],
  synchronize: false, // Don't auto-sync in production
  logging: true,
});

async function runSeed() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');

    // Run the role-based users seeder
    await createRoleBasedUsers(AppDataSource);

    console.log('🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('📦 Database connection closed.');
    process.exit(0);
  }
}

// Run the seeder
runSeed();
