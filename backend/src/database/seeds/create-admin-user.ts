import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.NODE_ENV === 'development' 
    ? 'queen-hills.db' 
    : (configService.get('DATABASE_URL') || 'queen-hills.db'),
  entities: [User],
  synchronize: false,
  logging: true,
});

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@queenhills.com' }
    });

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Active: ${existingAdmin.isActive}`);
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@queenhills.com');
      console.log('   Password: admin123 (or your previous password)');
    } else {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = userRepository.create({
        email: 'admin@queenhills.com',
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });
      await userRepository.save(adminUser);
      console.log('✅ Admin user created successfully!');
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@queenhills.com');
      console.log('   Password: admin123');
    }

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
createAdminUser().catch(console.error);

