import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../users/user.entity';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Create database schema (tables)
    await AppDataSource.synchronize();
    console.log('✅ Database schema created');

    // Create default admin user
    const userRepository = AppDataSource.getRepository(User);
    const plotRepository = AppDataSource.getRepository(Plot);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@queenhills.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = userRepository.create({
        email: 'admin@queenhills.com',
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });
      await userRepository.save(adminUser);
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create sample plots
    const existingPlots = await plotRepository.count();
    if (existingPlots === 0) {
      const samplePlots = [
        {
          plotNumber: 'A-001',
          sizeMarla: 5.0,
          sizeSqm: 125.0,
          phase: 'Phase 1',
          block: 'A',
          pricePkr: 2500000,
          status: PlotStatus.AVAILABLE,
          coordinates: '33.9041,73.3909'
        },
        {
          plotNumber: 'A-002',
          sizeMarla: 5.0,
          sizeSqm: 125.0,
          phase: 'Phase 1',
          block: 'A',
          pricePkr: 2400000,
          status: PlotStatus.AVAILABLE,
          coordinates: '33.9042,73.3910'
        },
        {
          plotNumber: 'B-001',
          sizeMarla: 7.5,
          sizeSqm: 187.5,
          phase: 'Phase 1',
          block: 'B',
          pricePkr: 3500000,
          status: PlotStatus.AVAILABLE,
          coordinates: '33.9043,73.3911'
        }
      ];

      for (const plotData of samplePlots) {
        const plot = plotRepository.create(plotData);
        await plotRepository.save(plot);
      }
      console.log('✅ Sample plots created');
    } else {
      console.log('ℹ️ Plots already exist');
    }

    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the seed function
seed().catch(console.error); 