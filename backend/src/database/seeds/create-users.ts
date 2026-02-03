import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get(getRepositoryToken(User));

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@queenhills.com' }
  });

  if (!existingAdmin) {
    // Create admin user
    const adminUser = userRepository.create({
      email: 'admin@queenhills.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: 'Super Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created successfully');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create accountant user
  const existingAccountant = await userRepository.findOne({
    where: { email: 'accountant@queenhills.com' }
  });

  if (!existingAccountant) {
    const accountantUser = userRepository.create({
      email: 'accountant@queenhills.com',
      passwordHash: await bcrypt.hash('accountant123', 10),
      fullName: 'Accountant',
      role: UserRole.ACCOUNTANT,
      isActive: true,
    });

    await userRepository.save(accountantUser);
    console.log('✅ Accountant user created successfully');
  } else {
    console.log('ℹ️ Accountant user already exists');
  }

  // Create sales agent user
  const existingSalesAgent = await userRepository.findOne({
    where: { email: 'sales@queenhills.com' }
  });

  if (!existingSalesAgent) {
    const salesUser = userRepository.create({
      email: 'sales@queenhills.com',
      passwordHash: await bcrypt.hash('sales123', 10),
      fullName: 'Sales Agent',
      role: UserRole.SALES_PERSON,
      isActive: true,
    });

    await userRepository.save(salesUser);
    console.log('✅ Sales agent user created successfully');
  } else {
    console.log('ℹ️ Sales agent user already exists');
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('👑 Super Admin: admin@queenhills.com / admin123');
  console.log('💰 Accountant: accountant@queenhills.com / accountant123');
  console.log('📞 Sales Agent: sales@queenhills.com / sales123');
  
  await app.close();
}

bootstrap().catch(console.error); 