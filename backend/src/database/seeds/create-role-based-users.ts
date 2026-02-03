import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

export async function createRoleBasedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Sample users with different roles
  const sampleUsers = [
    {
      email: 'admin@queenhills.com',
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
      password: 'admin123',
    },
    {
      email: 'sales1@queenhills.com',
      fullName: 'Ahmed Hassan',
      role: UserRole.SALES_PERSON,
      password: 'sales123',
    },
    {
      email: 'sales2@queenhills.com',
      fullName: 'Fatima Khan',
      role: UserRole.SALES_PERSON,
      password: 'sales123',
    },
    {
      email: 'sales3@queenhills.com',
      fullName: 'Muhammad Ali',
      role: UserRole.SALES_PERSON,
      password: 'sales123',
    },
    {
      email: 'accountant@queenhills.com',
      fullName: 'Sarah Ahmed',
      role: UserRole.ACCOUNTANT,
      password: 'account123',
    },
    {
      email: 'auditor@queenhills.com',
      fullName: 'Omar Malik',
      role: UserRole.AUDITOR,
      password: 'audit123',
    },
  ];

  console.log('Creating role-based users...');

  for (const userData of sampleUsers) {
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: userData.email }
    });

    if (!existingUser) {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = userRepository.create({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        passwordHash,
        isActive: true,
      });

      await userRepository.save(user);
      console.log(`✅ Created ${userData.role}: ${userData.fullName} (${userData.email})`);
    } else {
      // Update existing user's role if needed
      if (existingUser.role !== userData.role) {
        existingUser.role = userData.role;
        await userRepository.save(existingUser);
        console.log(`🔄 Updated role for: ${userData.fullName} (${userData.email}) to ${userData.role}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.fullName} (${userData.email})`);
      }
    }
  }

  console.log('✅ Role-based users creation completed!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@queenhills.com / admin123');
  console.log('Sales Person 1: sales1@queenhills.com / sales123');
  console.log('Sales Person 2: sales2@queenhills.com / sales123');
  console.log('Sales Person 3: sales3@queenhills.com / sales123');
  console.log('Accountant: accountant@queenhills.com / account123');
  console.log('Auditor: auditor@queenhills.com / audit123');
}
