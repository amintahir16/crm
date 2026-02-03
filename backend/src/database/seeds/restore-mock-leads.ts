import { AppDataSource } from '../data-source';
import { Lead, LeadSource, LeadStatus, LeadPriority } from '../../leads/lead.entity';
import { User, UserRole } from '../../users/user.entity';

async function restoreMockLeads() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = AppDataSource.getRepository(User);
    const leadRepo = AppDataSource.getRepository(Lead);

    console.log('📋 Creating mock leads...\n');

    // Get sales persons (use first available sales person or manager)
    let salesPerson = await userRepo.findOne({ 
      where: { role: UserRole.SALES_PERSON, isActive: true } 
    });
    
    if (!salesPerson) {
      // Try to get sales manager
      salesPerson = await userRepo.findOne({ 
        where: { role: UserRole.SALES_MANAGER, isActive: true } 
      });
    }

    if (!salesPerson) {
      console.log('⚠️  No sales person or manager found. Creating leads without assignment.');
    } else {
      console.log(`✅ Assigning leads to: ${salesPerson.fullName} (${salesPerson.email})\n`);
    }

    // Sample leads data
    const sampleLeads = [
      {
        fullName: 'Ahmed Khan',
        email: 'ahmed.khan@email.com',
        phone: '+92-300-1234567',
        source: LeadSource.WHATSAPP,
        sourceDetails: 'WhatsApp inquiry about plot prices',
        status: LeadStatus.NEW,
        priority: LeadPriority.HIGH,
        initialNotes: 'Interested in 5 marla plot in Phase 1. Budget around 50 lakh.',
        interests: '5 marla plot, Phase 1, good location',
        budgetRange: 5000000,
        preferredContactMethod: 'whatsapp',
        preferredContactTime: 'evening',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['5-marla', 'phase-1', 'high-budget']),
      },
      {
        fullName: 'Fatima Ali',
        email: 'fatima.ali@email.com',
        phone: '+92-321-9876543',
        source: LeadSource.FACEBOOK_ADS,
        sourceDetails: 'Facebook Ad Campaign - Summer 2024',
        status: LeadStatus.IN_PROCESS,
        priority: LeadPriority.MEDIUM,
        initialNotes: 'Saw our Facebook ad, interested in investment opportunity.',
        interests: '10 marla plot for investment',
        budgetRange: 8000000,
        preferredContactMethod: 'phone',
        preferredContactTime: 'morning',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['10-marla', 'investment', 'facebook']),
      },
      {
        fullName: 'Muhammad Usman',
        email: null,
        phone: '+92-333-5555555',
        source: LeadSource.REFERRAL,
        sourceDetails: 'Referred by existing customer - Mr. Hassan',
        status: LeadStatus.INTERESTED,
        priority: LeadPriority.URGENT,
        initialNotes: 'Friend of Mr. Hassan who bought last month. Very serious buyer.',
        interests: '7 marla plot, corner preferred',
        budgetRange: 6500000,
        preferredContactMethod: 'phone',
        preferredContactTime: 'afternoon',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['7-marla', 'corner-plot', 'referral', 'serious-buyer']),
      },
      {
        fullName: 'Aisha Malik',
        email: 'aisha.malik@gmail.com',
        phone: '+92-345-1111111',
        source: LeadSource.GOOGLE_ADS,
        sourceDetails: 'Google Search - "plots for sale Murree"',
        status: LeadStatus.INTERESTED,
        priority: LeadPriority.MEDIUM,
        initialNotes: 'Looking for a plot for family home. Wants to visit site.',
        interests: '5-7 marla plot, good access road',
        budgetRange: 4500000,
        preferredContactMethod: 'email',
        preferredContactTime: 'anytime',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['family-home', 'site-visit', 'google-ads']),
      },
      {
        fullName: 'Tariq Mahmood',
        email: 'tariq.mahmood@company.com',
        phone: '+92-300-7777777',
        source: LeadSource.WALK_IN,
        sourceDetails: 'Visited office directly',
        status: LeadStatus.WILL_VISIT,
        priority: LeadPriority.HIGH,
        initialNotes: 'Came to office, very interested. Needs to discuss with family.',
        interests: '10 marla plot, Phase 2',
        budgetRange: 9000000,
        preferredContactMethod: 'phone',
        preferredContactTime: 'evening',
        assignedToUserId: salesPerson?.id,
        nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        tags: JSON.stringify(['10-marla', 'phase-2', 'walk-in', 'family-decision']),
      },
      {
        fullName: 'Hassan Ali',
        email: 'hassan.ali@email.com',
        phone: '+92-301-2345678',
        source: LeadSource.WEBSITE,
        sourceDetails: 'Website contact form',
        status: LeadStatus.NEW,
        priority: LeadPriority.MEDIUM,
        initialNotes: 'Filled out contact form on website. Interested in Phase 1 plots.',
        interests: '5-6 marla plot, Phase 1',
        budgetRange: 5500000,
        preferredContactMethod: 'email',
        preferredContactTime: 'anytime',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['website', 'phase-1', '5-6-marla']),
      },
      {
        fullName: 'Sara Ahmed',
        email: 'sara.ahmed@email.com',
        phone: '+92-302-3456789',
        source: LeadSource.WHATSAPP,
        sourceDetails: 'WhatsApp Business inquiry',
        status: LeadStatus.IN_PROCESS,
        priority: LeadPriority.HIGH,
        initialNotes: 'Very responsive on WhatsApp. Wants to see plots this weekend.',
        interests: '8 marla plot, corner location preferred',
        budgetRange: 7500000,
        preferredContactMethod: 'whatsapp',
        preferredContactTime: 'evening',
        assignedToUserId: salesPerson?.id,
        tags: JSON.stringify(['whatsapp', '8-marla', 'corner', 'weekend-visit']),
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const leadData of sampleLeads) {
      // Check if lead exists by phone or email
      const existingLead = await leadRepo.findOne({ 
        where: [
          { phone: leadData.phone },
          ...(leadData.email ? [{ email: leadData.email }] : [])
        ]
      });

      if (!existingLead) {
        const lead = leadRepo.create(leadData);
        await leadRepo.save(lead);
        console.log(`  ✅ Created lead: ${leadData.fullName} (${leadData.status})`);
        created++;
      } else {
        console.log(`  ℹ️  Lead already exists: ${leadData.fullName}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Lead restoration completed!`);
    console.log(`   Created: ${created} leads`);
    console.log(`   Skipped: ${skipped} leads (already exist)`);

  } catch (error) {
    console.error('❌ Error restoring leads:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
restoreMockLeads().catch(console.error);

