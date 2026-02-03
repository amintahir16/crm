import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../users/user.entity';
import { Customer } from '../../customers/customer.entity';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import { Booking, BookingStatus } from '../../bookings/booking.entity';
import { PaymentSchedule, PaymentType, PaymentScheduleStatus } from '../../finance/payment-schedule.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../finance/payment.entity';
import { Installment, InstallmentStatus } from '../../finance/installment.entity';
import * as bcrypt from 'bcryptjs';

async function restoreAllTestData() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = AppDataSource.getRepository(User);
    const customerRepo = AppDataSource.getRepository(Customer);
    const plotRepo = AppDataSource.getRepository(Plot);
    const bookingRepo = AppDataSource.getRepository(Booking);
    const paymentScheduleRepo = AppDataSource.getRepository(PaymentSchedule);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const installmentRepo = AppDataSource.getRepository(Installment);

    // Step 1: Create Users
    console.log('👥 Creating users...');
    const users = [];
    
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
    users.push(admin);

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
    users.push(salesManager);

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
        console.log(`  ℹ️ Sales Person already exists: ${spData.name}`);
      }
      users.push(sp);
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
    users.push(accountant);

    // Step 2: Create Plots
    console.log('\n🏘️ Creating plots...');
    const existingPlots = await plotRepo.count();
    if (existingPlots === 0) {
      const plotsData = [
        { plotNumber: 'A-001', sizeMarla: 5.0, phase: 'Phase 1', block: 'A', pricePkr: 2500000, status: PlotStatus.AVAILABLE, coordinates: '33.9041,73.3909' },
        { plotNumber: 'A-002', sizeMarla: 5.0, phase: 'Phase 1', block: 'A', pricePkr: 2400000, status: PlotStatus.AVAILABLE, coordinates: '33.9042,73.3910' },
        { plotNumber: 'A-003', sizeMarla: 7.5, phase: 'Phase 1', block: 'A', pricePkr: 3500000, status: PlotStatus.SOLD, coordinates: '33.9043,73.3911' },
        { plotNumber: 'B-001', sizeMarla: 7.5, phase: 'Phase 1', block: 'B', pricePkr: 3600000, status: PlotStatus.AVAILABLE, coordinates: '33.9044,73.3912' },
        { plotNumber: 'B-002', sizeMarla: 10.0, phase: 'Phase 1', block: 'B', pricePkr: 4800000, status: PlotStatus.RESERVED, coordinates: '33.9045,73.3913' },
        { plotNumber: 'B-003', sizeMarla: 10.0, phase: 'Phase 1', block: 'B', pricePkr: 4900000, status: PlotStatus.AVAILABLE, coordinates: '33.9046,73.3914' },
        { plotNumber: 'C-001', sizeMarla: 5.0, phase: 'Phase 1', block: 'C', pricePkr: 2300000, status: PlotStatus.AVAILABLE, coordinates: '33.9047,73.3915' },
        { plotNumber: 'C-002', sizeMarla: 7.5, phase: 'Phase 1', block: 'C', pricePkr: 3400000, status: PlotStatus.SOLD, coordinates: '33.9048,73.3916' },
        { plotNumber: 'C-003', sizeMarla: 10.0, phase: 'Phase 1', block: 'C', pricePkr: 4700000, status: PlotStatus.AVAILABLE, coordinates: '33.9049,73.3917' },
        { plotNumber: 'D-001', sizeMarla: 5.0, phase: 'Phase 1', block: 'D', pricePkr: 2200000, status: PlotStatus.AVAILABLE, coordinates: '33.9050,73.3918' },
      ];

      for (const plotData of plotsData) {
        const plot = plotRepo.create({
          ...plotData,
          sizeSqm: plotData.sizeMarla * 25.29, // 1 Marla = 25.29 sqm
        });
        await plotRepo.save(plot);
      }
      console.log(`  ✅ Created ${plotsData.length} plots`);
    } else {
      console.log(`  ℹ️ ${existingPlots} plots already exist`);
    }

    const plots = await plotRepo.find();
    const availablePlots = plots.filter(p => p.status === PlotStatus.AVAILABLE);
    const soldPlots = plots.filter(p => p.status === PlotStatus.SOLD);

    // Step 3: Create Customers
    console.log('\n👤 Creating customers...');
    const existingCustomers = await customerRepo.count();
    if (existingCustomers === 0) {
      const customersData = [
        { cnic: '35201-1234567-1', fullName: 'Ahmed Khan', phone: '+92-300-1234567', email: 'ahmed.khan@email.com', address: 'Lahore, Pakistan' },
        { cnic: '35201-2345678-2', fullName: 'Fatima Ali', phone: '+92-301-2345678', email: 'fatima.ali@email.com', address: 'Islamabad, Pakistan' },
        { cnic: '35201-3456789-3', fullName: 'Muhammad Hassan', phone: '+92-302-3456789', email: 'muhammad.hassan@email.com', address: 'Karachi, Pakistan' },
        { cnic: '35201-4567890-4', fullName: 'Ayesha Malik', phone: '+92-303-4567890', email: 'ayesha.malik@email.com', address: 'Rawalpindi, Pakistan' },
        { cnic: '35201-5678901-5', fullName: 'Hassan Raza', phone: '+92-304-5678901', email: 'hassan.raza@email.com', address: 'Faisalabad, Pakistan' },
      ];

      for (const customerData of customersData) {
        const customer = customerRepo.create(customerData);
        await customerRepo.save(customer);
      }
      console.log(`  ✅ Created ${customersData.length} customers`);
    } else {
      console.log(`  ℹ️ ${existingCustomers} customers already exist`);
    }

    const customers = await customerRepo.find();

    // Step 4: Create Bookings
    console.log('\n📋 Creating bookings...');
    const existingBookings = await bookingRepo.count();
    if (existingBookings === 0 && soldPlots.length > 0 && customers.length > 0) {
      // Create bookings for sold plots
      for (let i = 0; i < Math.min(soldPlots.length, customers.length); i++) {
        const plot = soldPlots[i];
        const customer = customers[i];
        const salesPerson = users.find(u => u.role === UserRole.SALES_PERSON);

        const booking = bookingRepo.create({
          customerId: customer.id,
          plotId: plot.id,
          createdById: salesPerson?.id || admin.id,
          downPayment: plot.pricePkr * 0.2, // 20% down payment
          totalAmount: plot.pricePkr,
          paidAmount: plot.pricePkr * 0.2,
          pendingAmount: plot.pricePkr * 0.8,
          status: BookingStatus.CONFIRMED,
          bookingDate: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000), // Different dates
        });
        await bookingRepo.save(booking);
      }
      console.log(`  ✅ Created ${Math.min(soldPlots.length, customers.length)} bookings`);
    } else {
      console.log(`  ℹ️ ${existingBookings} bookings already exist`);
    }

    const bookings = await bookingRepo.find();

    // Step 5: Create Payment Schedules and Payments
    console.log('\n💰 Creating payment schedules and payments...');
    const existingSchedules = await paymentScheduleRepo.count();
    if (existingSchedules === 0 && bookings.length > 0) {
      for (const booking of bookings) {
        // Create payment schedule
        const paymentSchedule = paymentScheduleRepo.create({
          bookingId: booking.id,
          paymentType: PaymentType.INSTALLMENT,
          totalAmount: booking.totalAmount,
          downPayment: booking.downPayment,
          paidAmount: booking.paidAmount,
          pendingAmount: booking.pendingAmount,
          status: PaymentScheduleStatus.ACTIVE,
        });
        await paymentScheduleRepo.save(paymentSchedule);

        // Create initial payment (down payment)
        const initialPayment = paymentRepo.create({
          paymentScheduleId: paymentSchedule.id,
          amount: booking.downPayment,
          paymentDate: booking.bookingDate,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          status: PaymentStatus.COMPLETED,
          approvedBy: accountant.id,
          approvedAt: new Date(booking.bookingDate.getTime() + 24 * 60 * 60 * 1000),
        });
        await paymentRepo.save(initialPayment);

        // Create installments
        const remainingAmount = booking.pendingAmount;
        const installmentCount = 12; // 12 monthly installments
        const installmentAmount = remainingAmount / installmentCount;

        for (let i = 0; i < installmentCount; i++) {
          const dueDate = new Date(booking.bookingDate);
          dueDate.setMonth(dueDate.getMonth() + i + 1);

          const installment = installmentRepo.create({
            bookingId: booking.id,
            paymentScheduleId: paymentSchedule.id,
            amount: installmentAmount,
            dueDate: dueDate,
            status: i < 2 ? InstallmentStatus.PAID : InstallmentStatus.PENDING, // First 2 installments paid
            paidDate: i < 2 ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
          });
          await installmentRepo.save(installment);

          // Create payment for paid installments
          if (i < 2) {
            const payment = paymentRepo.create({
              paymentScheduleId: paymentSchedule.id,
              amount: installmentAmount,
              paymentDate: installment.paidDate!,
              paymentMethod: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.COMPLETED,
              approvedBy: accountant.id,
              approvedAt: installment.paidDate!,
            });
            await paymentRepo.save(payment);
          }
        }
      }
      console.log(`  ✅ Created payment schedules and payments for ${bookings.length} bookings`);
    } else {
      console.log(`  ℹ️ ${existingSchedules} payment schedules already exist`);
    }

    console.log('\n🎉 All test data restored successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@queenhills.com / admin123');
    console.log('   Sales Manager: manager@queenhills.com / manager123');
    console.log('   Sales Person 1: sales1@queenhills.com / sales123');
    console.log('   Sales Person 2: sales2@queenhills.com / sales123');
    console.log('   Sales Person 3: sales3@queenhills.com / sales123');
    console.log('   Accountant: accountant@queenhills.com / accountant123');

  } catch (error) {
    console.error('❌ Error restoring test data:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
restoreAllTestData().catch(console.error);

