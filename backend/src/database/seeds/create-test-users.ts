import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

async function createTestUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = AppDataSource.getRepository(User);

    console.log('👥 Creating test users...\n');

    // Admin user
    let admin = await userRepo.findOne({ where: { email: 'admin@queenhills.com' } });
    if (!admin) {
      admin = userRepo.create({
        email: 'admin@queenhills.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });
      admin = await userRepo.save(admin);
      console.log('  ✅ Admin user created');
    } else {
      console.log('  ℹ️ Admin user already exists');
    }

    // Sales Manager
    let salesManager = await userRepo.findOne({ where: { email: 'manager@queenhills.com' } });
    if (!salesManager) {
      salesManager = userRepo.create({
        email: 'manager@queenhills.com',
        passwordHash: await bcrypt.hash('manager123', 10),
        fullName: 'Sales Manager',
        role: UserRole.SALES_MANAGER,
        isActive: true,
      });
      salesManager = await userRepo.save(salesManager);
      console.log('  ✅ Sales Manager created');
    } else {
      console.log('  ℹ️ Sales Manager already exists');
    }

    // Sales Persons
    const salesPersonsData = [
      { email: 'sales1@queenhills.com', name: 'Ali Hassan', password: 'sales123' },
      { email: 'sales2@queenhills.com', name: 'Fatima Khan', password: 'sales123' },
      { email: 'sales3@queenhills.com', name: 'Ahmed Malik', password: 'sales123' },
    ];

    for (const spData of salesPersonsData) {
      let sp = await userRepo.findOne({ where: { email: spData.email } });
      if (!sp) {
        sp = userRepo.create({
          email: spData.email,
          passwordHash: await bcrypt.hash(spData.password, 10),
          fullName: spData.name,
          role: UserRole.SALES_PERSON,
          isActive: true,
          assignedToUserId: salesManager.id,
        });
        sp = await userRepo.save(sp);
        console.log(`  ✅ Sales Person created: ${spData.name}`);
      } else {
        // Update assignedToUserId if it's missing
        if (!sp.assignedToUserId && salesManager) {
          sp.assignedToUserId = salesManager.id;
          await userRepo.save(sp);
          console.log(`  🔄 Updated Sales Person: ${spData.name} (assigned to manager)`);
        } else {
          console.log(`  ℹ️ Sales Person already exists: ${spData.name}`);
        }
      }
    }

    // Accountant
    let accountant = await userRepo.findOne({ where: { email: 'accountant@queenhills.com' } });
    if (!accountant) {
      accountant = userRepo.create({
        email: 'accountant@queenhills.com',
        passwordHash: await bcrypt.hash('accountant123', 10),
        fullName: 'Accountant',
        role: UserRole.ACCOUNTANT,
        isActive: true,
      });
      accountant = await userRepo.save(accountant);
      console.log('  ✅ Accountant created');
    } else {
      console.log('  ℹ️ Accountant already exists');
    }

    console.log('\n🎉 Test users setup completed!');
    console.log('\n📝 Login Credentials:');
    console.log('   👑 Admin: admin@queenhills.com / admin123');
    console.log('   👔 Sales Manager: manager@queenhills.com / manager123');
    console.log('   📞 Sales Person 1: sales1@queenhills.com / sales123');
    console.log('   📞 Sales Person 2: sales2@queenhills.com / sales123');
    console.log('   📞 Sales Person 3: sales3@queenhills.com / sales123');
    console.log('   💰 Accountant: accountant@queenhills.com / accountant123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
createTestUsers().catch(console.error);

