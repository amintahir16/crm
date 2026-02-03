import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import { Lead, LeadStatus } from '../../leads/lead.entity';
import { SalesActivity, SalesActivityType } from '../../users/sales-activity.entity';

export async function seedDailySalesActivities(dataSource: DataSource) {
  console.log('🌱 Seeding daily sales activities...');

  const userRepository = dataSource.getRepository(User);
  const leadRepository = dataSource.getRepository(Lead);
  const salesActivityRepository = dataSource.getRepository(SalesActivity);

  // Get sales agents
  const salesAgents = await userRepository.find({
    where: { 
      role: UserRole.SALES_PERSON,
      isActive: true 
    }
  });

  if (salesAgents.length === 0) {
    console.log('❌ No sales agents found.');
    return;
  }

  // Get all leads
  const leads = await leadRepository.find({
    relations: ['assignedToUser']
  });

  if (leads.length === 0) {
    console.log('❌ No leads found.');
    return;
  }

  // Generate daily activities for the past 30 days
  const today = new Date();
  const activities = [];

  for (let day = 0; day < 30; day++) {
    const activityDate = new Date(today.getTime() - (day * 24 * 60 * 60 * 1000));
    
    // Skip weekends for some activities
    const isWeekend = activityDate.getDay() === 0 || activityDate.getDay() === 6;
    
    for (const agent of salesAgents) {
      const agentLeads = leads.filter(lead => lead.assignedToUserId === agent.id);
      
      // Random number of activities per day (1-5 on weekdays, 0-2 on weekends)
      const maxActivities = isWeekend ? 2 : 5;
      const numActivities = Math.floor(Math.random() * maxActivities) + (isWeekend ? 0 : 1);
      
      for (let i = 0; i < numActivities; i++) {
        const randomLead = agentLeads[Math.floor(Math.random() * agentLeads.length)];
        
        if (!randomLead) continue;

        const activityTypes = [
          SalesActivityType.CALL_MADE,
          SalesActivityType.FOLLOW_UP_COMPLETED,
          SalesActivityType.MEETING_SCHEDULED,
          SalesActivityType.SITE_VISIT_CONDUCTED,
          SalesActivityType.EMAIL_SENT,
          SalesActivityType.INTERACTION_LOGGED,
          SalesActivityType.DOCUMENT_UPLOADED,
          SalesActivityType.PAYMENT_DISCUSSED
        ];

        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        const descriptions = {
          [SalesActivityType.CALL_MADE]: `Called ${randomLead.fullName} - discussed plot requirements`,
          [SalesActivityType.FOLLOW_UP_COMPLETED]: `Follow-up call with ${randomLead.fullName} - checking interest level`,
          [SalesActivityType.MEETING_SCHEDULED]: `Scheduled site visit for ${randomLead.fullName} next week`,
          [SalesActivityType.SITE_VISIT_CONDUCTED]: `Completed site visit with ${randomLead.fullName} - very interested`,
          [SalesActivityType.EMAIL_SENT]: `Sent proposal to ${randomLead.fullName} for 5 marla plot`,
          [SalesActivityType.INTERACTION_LOGGED]: `Started price negotiation with ${randomLead.fullName}`,
          [SalesActivityType.DOCUMENT_UPLOADED]: `Prepared booking documents for ${randomLead.fullName}`,
          [SalesActivityType.PAYMENT_DISCUSSED]: `Addressed budget concerns with ${randomLead.fullName}`
        };

        const activity = {
          userId: agent.id,
          activityType: activityType,
          description: descriptions[activityType],
          relatedEntityType: 'lead',
          relatedEntityId: randomLead.id,
          metadata: {
            leadName: randomLead.fullName,
            leadStatus: randomLead.status,
            leadSource: randomLead.source
          },
          createdAt: new Date(activityDate.getTime() + (i * 60 * 60 * 1000)) // Spread throughout the day
        };

        activities.push(activity);
      }

      // Add some conversion activities for converted leads
      const convertedLeads = agentLeads.filter(lead => lead.status === LeadStatus.CLOSE_WON);
      if (convertedLeads.length > 0 && Math.random() < 0.3) { // 30% chance
        const randomConvertedLead = convertedLeads[Math.floor(Math.random() * convertedLeads.length)];
        
        const conversionActivities = [
          {
            activityType: SalesActivityType.LEAD_CONVERTED,
            description: `Successfully converted ${randomConvertedLead.fullName} to customer`,
            createdAt: new Date(activityDate.getTime() + (Math.random() * 8 * 60 * 60 * 1000)) // Random time in day
          },
          {
            activityType: SalesActivityType.BOOKING_CREATED,
            description: `Created booking for ${randomConvertedLead.fullName}`,
            createdAt: new Date(activityDate.getTime() + (Math.random() * 8 * 60 * 60 * 1000))
          },
          {
            activityType: SalesActivityType.CUSTOMER_CREATED,
            description: `Received down payment from ${randomConvertedLead.fullName}`,
            createdAt: new Date(activityDate.getTime() + (Math.random() * 8 * 60 * 60 * 1000))
          }
        ];

        const conversionActivity = conversionActivities[Math.floor(Math.random() * conversionActivities.length)];
        
        activities.push({
          userId: agent.id,
          activityType: conversionActivity.activityType,
          description: conversionActivity.description,
          relatedEntityType: 'lead',
          relatedEntityId: randomConvertedLead.id,
          metadata: {
            leadName: randomConvertedLead.fullName,
            leadStatus: randomConvertedLead.status,
            leadSource: randomConvertedLead.source
          },
          createdAt: conversionActivity.createdAt
        });
      }
    }
  }

  // Save all activities
  for (const activity of activities) {
    await salesActivityRepository.save(activity);
  }

  console.log(`✅ Created ${activities.length} daily sales activities`);

  // Calculate and display performance metrics
  console.log('\n📊 Sales Agent Performance Summary (Last 30 Days):');
  
  for (const agent of salesAgents) {
    const agentActivities = activities.filter(activity => activity.userId === agent.id);
    const agentLeads = leads.filter(lead => lead.assignedToUserId === agent.id);
    const convertedLeads = agentLeads.filter(lead => lead.status === LeadStatus.CLOSE_WON);
    
    const conversionRate = agentLeads.length > 0 ? (convertedLeads.length / agentLeads.length) * 100 : 0;
    const avgActivitiesPerDay = agentActivities.length / 30;
    
    console.log(`\n👤 ${agent.fullName}:`);
    console.log(`   - Total Leads: ${agentLeads.length}`);
    console.log(`   - Converted: ${convertedLeads.length} (${conversionRate.toFixed(1)}%)`);
    console.log(`   - Total Activities: ${agentActivities.length}`);
    console.log(`   - Avg Activities/Day: ${avgActivitiesPerDay.toFixed(1)}`);
    
    // Activity breakdown
    const activityBreakdown = {};
    agentActivities.forEach(activity => {
      activityBreakdown[activity.activityType] = (activityBreakdown[activity.activityType] || 0) + 1;
    });
    
    console.log(`   - Activity Breakdown:`);
    Object.entries(activityBreakdown).forEach(([type, count]) => {
      console.log(`     • ${type}: ${count}`);
    });
  }

  console.log('\n🎉 Daily sales activities seeding completed!');
}
