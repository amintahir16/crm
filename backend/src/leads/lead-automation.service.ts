import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadSource, LeadStatus, LeadPriority } from './lead.entity';
import { User, UserRole } from '../users/user.entity';
import { SalesActivityService } from '../users/sales-activity.service';
import { SalesActivityType } from '../users/sales-activity.entity';

export interface AutoLeadData {
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  sourceDetails: string;
  campaignId?: string;
  campaignName?: string;
  adSetName?: string;
  adName?: string;
  interests?: string;
  budgetRange?: number;
  initialNotes?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  formData?: any; // Additional form fields
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
}

export interface LeadAssignmentRule {
  source?: LeadSource;
  campaignPattern?: string;
  budgetMin?: number;
  budgetMax?: number;
  assignToUserId: string;
  priority: LeadPriority;
}

@Injectable()
export class LeadAutomationService {
  private readonly logger = new Logger(LeadAutomationService.name);

  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private salesActivityService: SalesActivityService,
  ) {}

  /**
   * Process incoming lead from various sources
   */
  async processIncomingLead(leadData: AutoLeadData): Promise<Lead> {
    try {
      this.logger.log(`Processing incoming lead from ${leadData.source}: ${leadData.fullName}`);

      // Check for duplicate leads
      const existingLead = await this.checkForDuplicate(leadData);
      if (existingLead) {
        this.logger.warn(`Duplicate lead detected: ${leadData.fullName} (${leadData.email || leadData.phone})`);
        return await this.updateExistingLead(existingLead, leadData);
      }

      // Determine lead priority based on source and data
      const priority = this.determinePriority(leadData);

      // Auto-assign to sales team member
      const assignedUserId = await this.autoAssignLead(leadData);

      // Create the lead
      const lead = this.leadRepository.create({
        fullName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        sourceDetails: this.buildSourceDetails(leadData),
        status: LeadStatus.NEW,
        priority,
        initialNotes: leadData.initialNotes || this.generateInitialNotes(leadData),
        interests: leadData.interests,
        budgetRange: leadData.budgetRange,
        preferredContactMethod: this.determinePreferredContact(leadData),
        assignedToUserId: assignedUserId,
        tags: JSON.stringify(this.generateTags(leadData)),
      });

      const savedLead = await this.leadRepository.save(lead);

      // Log activity for assigned sales person
      if (assignedUserId) {
        await this.salesActivityService.logActivity({
          userId: assignedUserId,
          activityType: SalesActivityType.LEAD_CREATED,
          description: `New lead auto-assigned: ${leadData.fullName} from ${leadData.source}`,
          entityType: 'lead',
          entityId: savedLead.id,
          potentialValue: leadData.budgetRange,
          isSuccessful: true,
          notes: `Auto-generated from ${leadData.source} campaign: ${leadData.campaignName || 'Unknown'}`,
        });
      }

      this.logger.log(`Lead created successfully: ${savedLead.id}`);
      return savedLead;

    } catch (error) {
      this.logger.error(`Error processing lead: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check for duplicate leads based on email or phone
   */
  private async checkForDuplicate(leadData: AutoLeadData): Promise<Lead | null> {
    if (leadData.email) {
      const emailMatch = await this.leadRepository.findOne({
        where: { email: leadData.email }
      });
      if (emailMatch) return emailMatch;
    }

    if (leadData.phone) {
      const phoneMatch = await this.leadRepository.findOne({
        where: { phone: leadData.phone }
      });
      if (phoneMatch) return phoneMatch;
    }

    return null;
  }

  /**
   * Update existing lead with new campaign data
   */
  private async updateExistingLead(existingLead: Lead, newData: AutoLeadData): Promise<Lead> {
    // Update with new campaign information
    existingLead.sourceDetails += `\n\nNew inquiry: ${newData.sourceDetails}`;
    existingLead.initialNotes += `\n\nAdditional inquiry from ${newData.source}: ${newData.initialNotes || 'No additional notes'}`;
    
    // Update tags
    const existingTags = JSON.parse(existingLead.tags || '[]');
    const newTags = this.generateTags(newData);
    const combinedTags = [...new Set([...existingTags, ...newTags])];
    existingLead.tags = JSON.stringify(combinedTags);

    // Update last contacted date
    existingLead.lastContactedAt = new Date();

    return await this.leadRepository.save(existingLead);
  }

  /**
   * Determine lead priority based on source and data
   */
  private determinePriority(leadData: AutoLeadData): LeadPriority {
    // High priority for high budget or premium campaigns
    if (leadData.budgetRange && leadData.budgetRange > 5000000) {
      return LeadPriority.URGENT;
    }

    // High priority for WhatsApp (more personal)
    if (leadData.source === LeadSource.WHATSAPP) {
      return LeadPriority.HIGH;
    }

    // Medium priority for paid ads
    if (leadData.source === LeadSource.FACEBOOK_ADS || leadData.source === LeadSource.GOOGLE_ADS) {
      return LeadPriority.MEDIUM;
    }

    return LeadPriority.LOW;
  }

  /**
   * Auto-assign lead to sales team member based on rules
   */
  private async autoAssignLead(leadData: AutoLeadData): Promise<string | null> {
    // Get all sales managers to find available team members
    const salesManagers = await this.userRepository.find({
      where: { 
        role: UserRole.SALES_MANAGER,
        isActive: true
      }
    });

    if (salesManagers.length === 0) {
      return null;
    }

    // For now, assign to the first sales manager's team
    // In a more complex system, you might have multiple sales managers
    const primaryManager = salesManagers[0];
    
    // Get available team members for this manager
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: primaryManager.id,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      order: { workloadScore: 'ASC' }
    });

    if (teamMembers.length === 0) {
      return null;
    }

    // Return the team member with lowest workload
    return teamMembers[0].id;
  }

  /**
   * Check if lead matches assignment rule
   */
  private matchesRule(leadData: AutoLeadData, rule: LeadAssignmentRule): boolean {
    if (rule.source && leadData.source !== rule.source) return false;
    if (rule.budgetMin && (!leadData.budgetRange || leadData.budgetRange < rule.budgetMin)) return false;
    if (rule.budgetMax && (!leadData.budgetRange || leadData.budgetRange > rule.budgetMax)) return false;
    if (rule.campaignPattern && !leadData.campaignName?.includes(rule.campaignPattern)) return false;
    
    return true;
  }

  /**
   * Get next available sales person (implement your logic here)
   */
  private async getNextAvailableSalesPerson(): Promise<string | null> {
    // Implement round-robin or load balancing logic
    // For now, return null (unassigned)
    return null;
  }

  /**
   * Build detailed source information
   */
  private buildSourceDetails(leadData: AutoLeadData): string {
    let details = `Source: ${leadData.source}`;
    
    if (leadData.campaignName) details += `\nCampaign: ${leadData.campaignName}`;
    if (leadData.adSetName) details += `\nAd Set: ${leadData.adSetName}`;
    if (leadData.adName) details += `\nAd: ${leadData.adName}`;
    if (leadData.utmSource) details += `\nUTM Source: ${leadData.utmSource}`;
    if (leadData.utmMedium) details += `\nUTM Medium: ${leadData.utmMedium}`;
    if (leadData.utmCampaign) details += `\nUTM Campaign: ${leadData.utmCampaign}`;
    if (leadData.referrerUrl) details += `\nReferrer: ${leadData.referrerUrl}`;
    
    return details;
  }

  /**
   * Generate initial notes based on lead data
   */
  private generateInitialNotes(leadData: AutoLeadData): string {
    let notes = `Auto-generated lead from ${leadData.source}`;
    
    if (leadData.campaignName) {
      notes += ` via campaign "${leadData.campaignName}"`;
    }
    
    if (leadData.budgetRange) {
      notes += `\nBudget range: ${this.formatCurrency(leadData.budgetRange)}`;
    }
    
    if (leadData.interests) {
      notes += `\nInterests: ${leadData.interests}`;
    }
    
    return notes;
  }

  /**
   * Determine preferred contact method
   */
  private determinePreferredContact(leadData: AutoLeadData): string {
    if (leadData.source === LeadSource.WHATSAPP) return 'whatsapp';
    if (leadData.email && leadData.phone) return 'phone';
    if (leadData.email) return 'email';
    if (leadData.phone) return 'phone';
    return 'email';
  }

  /**
   * Generate tags for lead categorization
   */
  private generateTags(leadData: AutoLeadData): string[] {
    const tags: string[] = [];
    
    // Source-based tags
    tags.push(leadData.source.toLowerCase());
    
    // Campaign-based tags
    if (leadData.campaignName) {
      tags.push(`campaign-${leadData.campaignName.toLowerCase().replace(/\s+/g, '-')}`);
    }
    
    // Budget-based tags
    if (leadData.budgetRange) {
      if (leadData.budgetRange >= 10000000) tags.push('high-budget');
      else if (leadData.budgetRange >= 5000000) tags.push('medium-budget');
      else tags.push('low-budget');
    }
    
    // Interest-based tags
    if (leadData.interests) {
      const interestTags = leadData.interests.toLowerCase().split(',').map(i => i.trim());
      tags.push(...interestTags);
    }
    
    // UTM-based tags
    if (leadData.utmSource) tags.push(`utm-${leadData.utmSource}`);
    if (leadData.utmMedium) tags.push(`medium-${leadData.utmMedium}`);
    
    return tags;
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
