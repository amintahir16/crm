import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'queen-hills.db',
  entities: [],
  synchronize: false,
  logging: true,
});

async function createAdminUser() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Check if admin user already exists
    const existingAdmin = await AppDataSource.query(
      `SELECT * FROM users WHERE email = 'admin@queenhills.com'`
    );

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('ℹ️ Admin user already exists');
      console.log(`   Email: ${existingAdmin[0].email}`);
      console.log(`   Role: ${existingAdmin[0].role}`);
      console.log(`   Active: ${existingAdmin[0].isActive}`);
      console.log('\n📝 Login credentials:');
      console.log('   Email: admin@queenhills.com');
      console.log('   Password: admin123 (or your previous password)');
    } else {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Generate a UUID-like ID for SQLite
      const userId = 'admin-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      await AppDataSource.query(`
        INSERT INTO users (id, email, passwordHash, fullName, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [userId, 'admin@queenhills.com', hashedPassword, 'System Administrator', 'admin', 1]);
      
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

