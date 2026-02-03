import { AppDataSource } from '../data-source';
import { Lead, LeadSource, LeadStatus, LeadPriority } from '../../leads/lead.entity';
import { User, UserRole } from '../../users/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedLeads() {
  const dataSource = AppDataSource;
  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const leadRepository = dataSource.getRepository(Lead);

  // Create a sales agent if it doesn't exist
  let salesAgent = await userRepository.findOne({ where: { email: 'sales@queenhills.com' } });
  if (!salesAgent) {
    salesAgent = userRepository.create({
      email: 'sales@queenhills.com',
      passwordHash: await bcrypt.hash('password123', 10),
      fullName: 'Sales Agent',
      role: UserRole.SALES_PERSON,
      isActive: true,
    });
    await userRepository.save(salesAgent);
    console.log('Created sales agent user');
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
      assignedToUserId: salesAgent.id,
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
      assignedToUserId: salesAgent.id,
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
      assignedToUserId: salesAgent.id,
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
      assignedToUserId: salesAgent.id,
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
      assignedToUserId: salesAgent.id,
      nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      tags: JSON.stringify(['10-marla', 'phase-2', 'walk-in', 'family-decision']),
    },
  ];

  for (const leadData of sampleLeads) {
    const existingLead = await leadRepository.findOne({ 
      where: { 
        email: leadData.email || undefined,
        phone: leadData.phone 
      } 
    });

    if (!existingLead) {
      const lead = leadRepository.create(leadData);
      await leadRepository.save(lead);
      console.log(`Created lead: ${leadData.fullName}`);
    } else {
      console.log(`Lead already exists: ${leadData.fullName}`);
    }
  }

  await dataSource.destroy();
  console.log('Lead seeding completed!');
}

// Run if called directly
if (require.main === module) {
  seedLeads().catch(console.error);
}
