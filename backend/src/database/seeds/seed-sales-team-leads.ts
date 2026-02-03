import { DataSource } from 'typeorm';
import { Lead, LeadSource, LeadStatus, LeadPriority } from '../../leads/lead.entity';
import { User, UserRole } from '../../users/user.entity';

export async function seedSalesTeamLeads(dataSource: DataSource) {
  const leadRepository = dataSource.getRepository(Lead);
  const userRepository = dataSource.getRepository(User);

  // Get all sales team members
  const salesTeam = await userRepository.find({
    where: { role: UserRole.SALES_PERSON, isActive: true },
    select: ['id', 'fullName']
  });

  if (salesTeam.length === 0) {
    console.log('No sales team members found. Please create sales team members first.');
    return;
  }

  console.log(`Found ${salesTeam.length} sales team members`);

  // Sample leads data
  const sampleLeads = [
    {
      fullName: 'Hassan Ali',
      email: 'hassan.ali@email.com',
      phone: '+92-300-1234567',
      source: LeadSource.WHATSAPP,
      sourceDetails: 'WhatsApp inquiry',
      status: LeadStatus.NEW,
      priority: LeadPriority.HIGH,
      interests: '5 Marla plot in Phase 1',
      budgetRange: 5000000,
      initialNotes: 'Interested in Phase 1 plots, ready to invest'
    },
    {
      fullName: 'Ayesha Khan',
      email: 'ayesha.khan@email.com',
      phone: '+92-301-2345678',
      source: LeadSource.FACEBOOK_ADS,
      sourceDetails: 'Facebook Premium Campaign',
      status: LeadStatus.IN_PROCESS,
      priority: LeadPriority.MEDIUM,
      interests: '10 Marla plot',
      budgetRange: 8000000,
      initialNotes: 'Saw Facebook ad, interested in larger plots'
    },
    {
      fullName: 'Muhammad Farooq',
      email: 'm.farooq@email.com',
      phone: '+92-302-3456789',
      source: LeadSource.REFERRAL,
      sourceDetails: 'Referred by existing customer',
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.HIGH,
      interests: '3 Marla plot',
      budgetRange: 3000000,
      initialNotes: 'Good referral, high conversion potential'
    },
    {
      fullName: 'Fatima Sheikh',
      email: 'fatima.sheikh@email.com',
      phone: '+92-303-4567890',
      source: LeadSource.WEBSITE,
      sourceDetails: 'Website contact form',
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.MEDIUM,
      interests: '7 Marla plot',
      budgetRange: 6000000,
      initialNotes: 'Filled contact form, looking for family investment'
    },
    {
      fullName: 'Abdul Rahman',
      email: 'abdul.rahman@email.com',
      phone: '+92-304-5678901',
      source: LeadSource.WHATSAPP,
      sourceDetails: 'WhatsApp Business',
      status: LeadStatus.WILL_VISIT,
      priority: LeadPriority.URGENT,
      interests: '12 Marla plot',
      budgetRange: 10000000,
      initialNotes: 'Urgent inquiry, wants to close quickly'
    },
    {
      fullName: 'Zainab Malik',
      email: 'zainab.malik@email.com',
      phone: '+92-305-6789012',
      source: LeadSource.FACEBOOK_ADS,
      sourceDetails: 'Facebook Standard Campaign',
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      interests: '5 Marla plot',
      budgetRange: 4500000,
      initialNotes: 'Facebook lead, needs follow-up'
    },
    {
      fullName: 'Tariq Hussain',
      email: 'tariq.hussain@email.com',
      phone: '+92-306-7890123',
      source: LeadSource.REFERRAL,
      sourceDetails: 'Employee referral',
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.HIGH,
      interests: '8 Marla plot',
      budgetRange: 7000000,
      initialNotes: 'Employee referral, strong lead'
    },
    {
      fullName: 'Nida Ahmed',
      email: 'nida.ahmed@email.com',
      phone: '+92-307-8901234',
      source: LeadSource.WEBSITE,
      sourceDetails: 'Website inquiry',
      status: LeadStatus.INTERESTED,
      priority: LeadPriority.MEDIUM,
      interests: '6 Marla plot',
      budgetRange: 5500000,
      initialNotes: 'Website inquiry, needs qualification'
    }
  ];

  // Assign leads to team members in round-robin fashion
  let currentAgentIndex = 0;

  for (const leadData of sampleLeads) {
    const assignedAgent = salesTeam[currentAgentIndex];
    
    const lead = leadRepository.create({
      ...leadData,
      assignedToUserId: assignedAgent.id,
      generatedByUserId: null, // System generated
      tags: JSON.stringify(['new-lead', 'sample-data'])
    });

    await leadRepository.save(lead);
    
    console.log(`Created lead for ${leadData.fullName} assigned to ${assignedAgent.fullName}`);
    
    // Move to next agent
    currentAgentIndex = (currentAgentIndex + 1) % salesTeam.length;
  }

  console.log(`Successfully created ${sampleLeads.length} sample leads and assigned them to sales team members`);
}
