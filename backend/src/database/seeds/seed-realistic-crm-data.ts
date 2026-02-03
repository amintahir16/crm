import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import { Lead, LeadSource, LeadStatus, LeadPriority } from '../../leads/lead.entity';
import { Customer } from '../../customers/customer.entity';
import { Plot, PlotStatus } from '../../plots/plot.entity';
import { Booking, BookingStatus } from '../../bookings/booking.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../finance/payment.entity';
import { PaymentSchedule, PaymentType, PaymentScheduleStatus } from '../../finance/payment-schedule.entity';
import { SalesActivity, SalesActivityType } from '../../users/sales-activity.entity';

export async function seedRealisticCRMData(dataSource: DataSource) {
  console.log('🌱 Seeding realistic CRM data...');

  const userRepository = dataSource.getRepository(User);
  const leadRepository = dataSource.getRepository(Lead);
  const customerRepository = dataSource.getRepository(Customer);
  const plotRepository = dataSource.getRepository(Plot);
  const bookingRepository = dataSource.getRepository(Booking);
  const paymentRepository = dataSource.getRepository(Payment);
  const paymentScheduleRepository = dataSource.getRepository(PaymentSchedule);
  const salesActivityRepository = dataSource.getRepository(SalesActivity);

  // Get sales team members
  const salesManager = await userRepository.findOne({
    where: { email: 'manager@queenhills.com' }
  });

  const salesAgents = await userRepository.find({
    where: { 
      role: UserRole.SALES_PERSON,
      isActive: true 
    }
  });

  if (!salesManager || salesAgents.length === 0) {
    console.log('❌ Sales manager or agents not found. Please run user seeding first.');
    return;
  }

  // Get available plots
  const plots = await plotRepository.find({
    where: { status: PlotStatus.AVAILABLE },
    take: 20
  });

  if (plots.length === 0) {
    console.log('❌ No available plots found. Please seed plots first.');
    return;
  }

  // Sample lead data with realistic progression
  const leadData = [
    // High-performing agent leads (Ali Hassan)
    {
      fullName: 'Ahmed Khan',
      email: 'ahmed.khan@email.com',
      phone: '+92-300-1234567',
      source: LeadSource.WHATSAPP,
      status: LeadStatus.CLOSE_WON,
      priority: LeadPriority.HIGH,
      assignedAgent: salesAgents[0], // Ali Hassan
      notes: 'Interested in 5 marla plot, budget 25-30 lakhs',
      createdAt: new Date('2024-09-15'),
      convertedAt: new Date('2024-09-20')
    },
    {
      fullName: 'Fatima Ali',
      email: 'fatima.ali@email.com',
      phone: '+92-301-2345678',
      source: LeadSource.FACEBOOK_ADS,
      status: LeadStatus.CLOSE_WON,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[0], // Ali Hassan
      notes: 'Looking for investment opportunity, prefers commercial plots',
      createdAt: new Date('2024-09-10'),
      convertedAt: new Date('2024-09-18')
    },
    {
      fullName: 'Muhammad Hassan',
      email: 'muhammad.hassan@email.com',
      phone: '+92-302-3456789',
      source: LeadSource.REFERRAL,
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.HIGH,
      assignedAgent: salesAgents[0], // Ali Hassan
      notes: 'Very interested, wants to visit site this week',
      createdAt: new Date('2024-10-01')
    },
    {
      fullName: 'Ayesha Malik',
      email: 'ayesha.malik@email.com',
      phone: '+92-303-4567890',
      source: LeadSource.WEBSITE,
      status: LeadStatus.IN_PROCESS,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[0], // Ali Hassan
      notes: 'Initial contact made, scheduled follow-up call',
      createdAt: new Date('2024-10-05')
    },

    // Medium-performing agent leads (Sara Ahmed)
    {
      fullName: 'Usman Sheikh',
      email: 'usman.sheikh@email.com',
      phone: '+92-304-5678901',
      source: LeadSource.GOOGLE_ADS,
      status: LeadStatus.CLOSE_WON,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[1], // Sara Ahmed
      notes: 'Booked 3 marla plot, payment completed',
      createdAt: new Date('2024-09-08'),
      convertedAt: new Date('2024-09-25')
    },
    {
      fullName: 'Zainab Khan',
      email: 'zainab.khan@email.com',
      phone: '+92-305-6789012',
      source: LeadSource.INSTAGRAM_ADS,
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.HIGH,
      assignedAgent: salesAgents[1], // Sara Ahmed
      notes: 'Very interested in residential plots, budget flexible',
      createdAt: new Date('2024-09-28')
    },
    {
      fullName: 'Hassan Raza',
      email: 'hassan.raza@email.com',
      phone: '+92-306-7890123',
      source: LeadSource.WHATSAPP,
      status: LeadStatus.NEW,
      priority: LeadPriority.LOW,
      assignedAgent: salesAgents[1], // Sara Ahmed
      notes: 'Just inquired, needs more information',
      createdAt: new Date('2024-10-07')
    },

    // Lower-performing agent leads (Omar Khan)
    {
      fullName: 'Nadia Ahmed',
      email: 'nadia.ahmed@email.com',
      phone: '+92-307-8901234',
      source: LeadSource.WALK_IN,
      status: LeadStatus.CLOSE_WON,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[2], // Omar Khan
      notes: 'Walk-in customer, booked immediately',
      createdAt: new Date('2024-09-12'),
      convertedAt: new Date('2024-09-12')
    },
    {
      fullName: 'Ali Raza',
      email: 'ali.raza@email.com',
      phone: '+92-308-9012345',
      source: LeadSource.PHONE_CALL,
      status: LeadStatus.NOT_INTERESTED,
      priority: LeadPriority.LOW,
      assignedAgent: salesAgents[2], // Omar Khan
      notes: 'Not interested after initial discussion',
      createdAt: new Date('2024-09-20')
    },
    {
      fullName: 'Saima Khan',
      email: 'saima.khan@email.com',
      phone: '+92-309-0123456',
      source: LeadSource.WEBSITE,
      status: LeadStatus.WILL_VISIT,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[2], // Omar Khan
      notes: 'Needs follow-up call next week',
      createdAt: new Date('2024-10-02')
    },

    // Ahmed Saleem leads (mixed performance)
    {
      fullName: 'Bilal Ahmed',
      email: 'bilal.ahmed@email.com',
      phone: '+92-310-1234567',
      source: LeadSource.REFERRAL,
      status: LeadStatus.CLOSE_WON,
      priority: LeadPriority.HIGH,
      assignedAgent: salesAgents[3], // Ahmed Saleem
      notes: 'Referred by existing customer, high priority',
      createdAt: new Date('2024-09-05'),
      convertedAt: new Date('2024-09-15')
    },
    {
      fullName: 'Maryam Sheikh',
      email: 'maryam.sheikh@email.com',
      phone: '+92-311-2345678',
      source: LeadSource.FACEBOOK_ADS,
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.MEDIUM,
      assignedAgent: salesAgents[3], // Ahmed Saleem
      notes: 'Qualified lead, waiting for site visit',
      createdAt: new Date('2024-09-30')
    },
    {
      fullName: 'Tariq Malik',
      email: 'tariq.malik@email.com',
      phone: '+92-312-3456789',
      source: LeadSource.WHATSAPP,
      status: LeadStatus.NOT_INTERESTED,
      priority: LeadPriority.LOW,
      assignedAgent: salesAgents[3], // Ahmed Saleem
      notes: 'Lost to competitor, price was main factor',
      createdAt: new Date('2024-09-18')
    }
  ];

  // Create leads
  const createdLeads = [];
  for (const leadInfo of leadData) {
    const lead = leadRepository.create({
      fullName: leadInfo.fullName,
      email: leadInfo.email,
      phone: leadInfo.phone,
      source: leadInfo.source,
      status: leadInfo.status,
      priority: leadInfo.priority,
      assignedToUserId: leadInfo.assignedAgent.id,
      createdAt: leadInfo.createdAt,
      updatedAt: leadInfo.createdAt
    });

    const savedLead = await leadRepository.save(lead);
    createdLeads.push({ ...savedLead, assignedAgent: leadInfo.assignedAgent, convertedAt: leadInfo.convertedAt });
  }

  console.log(`✅ Created ${createdLeads.length} leads`);

  // Create customers and bookings for converted leads
  const convertedLeads = createdLeads.filter(lead => lead.status === LeadStatus.CLOSE_WON);
  
  for (const lead of convertedLeads) {
    // Create customer
    const customer = customerRepository.create({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      address: `${lead.fullName.split(' ')[0]} House, Murree Road, Rawalpindi`,
      cnic: `42101-${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 9) + 1}`,
      createdAt: lead.convertedAt || lead.createdAt,
      updatedAt: lead.convertedAt || lead.createdAt
    });

    const savedCustomer = await customerRepository.save(customer);

    // Select a random plot
    const selectedPlot = plots[Math.floor(Math.random() * plots.length)];

    // Create booking
    const booking = bookingRepository.create({
      customerId: savedCustomer.id,
      plotId: selectedPlot.id,
      totalAmount: selectedPlot.pricePkr,
      downPayment: Math.floor(selectedPlot.pricePkr * 0.1), // 10% down payment
      bookingDate: lead.convertedAt || lead.createdAt,
      status: BookingStatus.CONFIRMED,
      createdById: lead.assignedAgent.id,
      createdAt: lead.convertedAt || lead.createdAt,
      updatedAt: lead.convertedAt || lead.createdAt
    });

    const savedBooking = await bookingRepository.save(booking);

    // Create payment schedule
    const monthlyInstallment = Math.floor((selectedPlot.pricePkr * 0.9) / 24);
    const paymentSchedule = paymentScheduleRepository.create({
      bookingId: savedBooking.id,
      paymentType: PaymentType.INSTALLMENT,
      status: PaymentScheduleStatus.ACTIVE,
      totalAmount: selectedPlot.pricePkr,
      downPayment: booking.downPayment,
      installmentCount: 24,
      installmentAmount: monthlyInstallment,
      installmentFrequency: 'monthly',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + (30 + 24 * 30) * 24 * 60 * 60 * 1000), // 24 months later
      createdAt: lead.convertedAt || lead.createdAt
    });

    await paymentScheduleRepository.save(paymentSchedule);

    // Create down payment
    const downPayment = paymentRepository.create({
      paymentScheduleId: paymentSchedule.id,
      amount: booking.downPayment,
      paymentDate: lead.convertedAt || lead.createdAt,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      referenceNumber: `DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      processedBy: lead.assignedAgent.id,
      approvedBy: salesManager.id,
      approvedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Approved next day
      createdAt: lead.convertedAt || lead.createdAt
    });

    await paymentRepository.save(downPayment);

    // Update lead with customer reference
    await leadRepository.update(lead.id, {
      convertedToCustomerId: savedCustomer.id,
      convertedByUserId: lead.assignedAgent.id,
      convertedAt: lead.convertedAt || lead.createdAt
    });

    console.log(`✅ Created customer and booking for ${lead.fullName}`);
  }

  // Create sales activities for tracking
  const activityTypes = [
    'lead_created',
    'lead_contacted',
    'lead_qualified',
    'lead_converted',
    'customer_created',
    'booking_created',
    'payment_received'
  ];

  for (const lead of createdLeads) {
    // Lead created activity
    await salesActivityRepository.save({
      userId: lead.assignedAgent.id,
      activityType: SalesActivityType.LEAD_CREATED,
      description: `New lead created: ${lead.fullName}`,
      relatedEntityType: 'lead',
      relatedEntityId: lead.id,
      metadata: {
        leadSource: lead.source,
        leadPriority: lead.priority
      },
      createdAt: lead.createdAt
    });

    // Contact activity
    await salesActivityRepository.save({
      userId: lead.assignedAgent.id,
      activityType: SalesActivityType.CALL_MADE,
      description: `Contacted lead: ${lead.fullName}`,
      relatedEntityType: 'lead',
      relatedEntityId: lead.id,
      createdAt: new Date(lead.createdAt.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
    });

    if (lead.status === LeadStatus.INTERESTED || lead.status === LeadStatus.CLOSE_WON) {
      // Qualification activity
      await salesActivityRepository.save({
        userId: lead.assignedAgent.id,
        activityType: SalesActivityType.FOLLOW_UP_COMPLETED,
        description: `Qualified lead: ${lead.fullName}`,
        relatedEntityType: 'lead',
        relatedEntityId: lead.id,
        createdAt: new Date(lead.createdAt.getTime() + 24 * 60 * 60 * 1000) // 1 day later
      });
    }

    if (lead.status === LeadStatus.CLOSE_WON) {
      // Conversion activity
      await salesActivityRepository.save({
        userId: lead.assignedAgent.id,
        activityType: SalesActivityType.LEAD_CONVERTED,
        description: `Converted lead to customer: ${lead.fullName}`,
        relatedEntityType: 'lead',
        relatedEntityId: lead.id,
        createdAt: lead.convertedAt || lead.createdAt
      });
    }
  }

  console.log(`✅ Created sales activities for all leads`);

  // Update workload scores for sales agents based on their performance
  for (let i = 0; i < salesAgents.length; i++) {
    const agent = salesAgents[i];
    const agentLeads = createdLeads.filter(lead => lead.assignedAgent.id === agent.id);
    const convertedLeads = agentLeads.filter(lead => lead.status === LeadStatus.CLOSE_WON);
    
    // Calculate workload score (lower is better)
    const conversionRate = agentLeads.length > 0 ? (convertedLeads.length / agentLeads.length) * 100 : 0;
    const workloadScore = Math.max(0, 10 - conversionRate); // Lower conversion rate = higher workload score

    await userRepository.update(agent.id, {
      workloadScore: Math.round(workloadScore * 10) / 10
    });

    console.log(`✅ Updated workload for ${agent.fullName}: ${Math.round(workloadScore * 10) / 10} (${convertedLeads.length}/${agentLeads.length} converted)`);
  }

  console.log('🎉 Realistic CRM data seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total Leads: ${createdLeads.length}`);
  console.log(`   - Converted Leads: ${convertedLeads.length}`);
  console.log(`   - Conversion Rate: ${((convertedLeads.length / createdLeads.length) * 100).toFixed(1)}%`);
  console.log(`   - Sales Agents: ${salesAgents.length}`);
  
  // Performance summary by agent
  for (const agent of salesAgents) {
    const agentLeads = createdLeads.filter(lead => lead.assignedAgent.id === agent.id);
    const agentConverted = agentLeads.filter(lead => lead.status === LeadStatus.CLOSE_WON);
    const conversionRate = agentLeads.length > 0 ? (agentConverted.length / agentLeads.length) * 100 : 0;
    
    console.log(`   - ${agent.fullName}: ${agentConverted.length}/${agentLeads.length} (${conversionRate.toFixed(1)}%)`);
  }
}
