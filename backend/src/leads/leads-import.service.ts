import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadSource, LeadStatus, LeadPriority } from './lead.entity';
import { User, UserRole } from '../users/user.entity';
import { LeadAutomationService } from './lead-automation.service';
import { CrmNotificationService } from './crm-notification.service';
import { LiveWorkloadService } from '../users/live-workload.service';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

export interface LeadImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  importedLeads: Lead[];
}

@Injectable()
export class LeadsImportService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private leadAutomationService: LeadAutomationService,
    private liveWorkloadService: LiveWorkloadService,
    private crmNotificationService: CrmNotificationService,
  ) { }

  async importLeadsFromCSV(csvBuffer: Buffer, user: { userId: string, role: string }): Promise<LeadImportResult> {
    const result: LeadImportResult = {
      totalRows: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      importedLeads: [],
    };

    try {
      // Note: Auto-assignment is disabled for managers (unassigned by default).
      // However, for sales persons, we auto-assign the lead to THEM.
      console.log('🔍 Import initiated by user:', JSON.stringify(user));
      const shouldAutoAssignToUploader = user.role?.toLowerCase() === 'sales_person';
      console.log('🤖 Auto-assign to uploader?', shouldAutoAssignToUploader);

      const leads: any[] = [];
      const stream = Readable.from(csvBuffer.toString());

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            leads.push(row);
            result.totalRows++;
          })
          .on('end', resolve)
          .on('error', reject);
      });

      console.log(`📊 Processing ${leads.length} leads from CSV`);

      // Process each lead
      for (let i = 0; i < leads.length; i++) {
        const row = leads[i];
        const rowNumber = i + 1;

        try {
          // Skip test/dummy data rows
          if (this.isTestData(row)) {
            console.log(`⏭️ Skipping test data row ${rowNumber}`);
            continue;
          }

          // Parse Facebook/Instagram lead data
          const parsedLead = this.parseFacebookLead(row);
          if (!parsedLead) {
            result.errors.push(`Row ${rowNumber}: Invalid lead data format`);
            result.failedImports++;
            continue;
          }

          // Validate required fields
          if (!parsedLead.fullName || (!parsedLead.email && !parsedLead.phone)) {
            result.errors.push(`Row ${rowNumber}: Missing required fields (fullName and either email or phone)`);
            result.failedImports++;
            continue;
          }

          // Validate email format if provided
          if (parsedLead.email && !this.isValidEmail(parsedLead.email)) {
            result.errors.push(`Row ${rowNumber}: Invalid email format - ${parsedLead.email}`);
            result.failedImports++;
            continue;
          }

          // Validate phone format if provided
          if (parsedLead.phone && !this.isValidPhone(parsedLead.phone)) {
            result.errors.push(`Row ${rowNumber}: Invalid phone format - ${parsedLead.phone}`);
            result.failedImports++;
            continue;
          }

          // Check for duplicate email
          if (parsedLead.email) {
            const existingLead = await this.leadRepository.findOne({
              where: { email: parsedLead.email }
            });
            if (existingLead) {
              result.errors.push(`Row ${rowNumber}: Lead with email ${parsedLead.email} already exists`);
              result.failedImports++;
              continue;
            }
          }

          // Check for duplicate phone
          if (parsedLead.phone) {
            const existingLead = await this.leadRepository.findOne({
              where: { phone: parsedLead.phone }
            });
            if (existingLead) {
              result.errors.push(`Row ${rowNumber}: Lead with phone ${parsedLead.phone} already exists`);
              result.failedImports++;
              continue;
            }
          }

          // Extract leadId from CSV if available (from sourceDetails)
          let leadId: string | undefined;
          try {
            const sourceDetailsObj = JSON.parse(parsedLead.sourceDetails || '{}');
            if (sourceDetailsObj.leadId) {
              leadId = sourceDetailsObj.leadId;
            }
          } catch (e) {
            // If sourceDetails is not JSON, try to extract from row directly
            if (row.id || row.leadId || row.lead_id) {
              leadId = row.id || row.leadId || row.lead_id;
            }
          }

          // Create lead
          const lead = this.leadRepository.create({
            leadId, // Use leadId from CSV if available
            fullName: parsedLead.fullName.trim(),
            email: parsedLead.email ? parsedLead.email.trim().toLowerCase() : null,
            phone: parsedLead.phone ? parsedLead.phone.trim() : null,
            source: parsedLead.source,
            sourceDetails: parsedLead.sourceDetails,
            status: LeadStatus.NEW,
            priority: parsedLead.priority,
            initialNotes: parsedLead.initialNotes,
            interests: parsedLead.interests,
            budgetRange: parsedLead.budgetRange,
            preferredContactMethod: parsedLead.preferredContactMethod,
            preferredContactTime: parsedLead.preferredContactTime,
            generatedByUserId: user.userId,
            createdAt: parsedLead.createdAt,
          });

          // Auto-assign to uploader if they are a sales person
          if (shouldAutoAssignToUploader) {
            lead.assignedToUserId = user.userId;
          }

          // Save lead
          const savedLead = await this.leadRepository.save(lead);
          result.importedLeads.push(savedLead);
          result.successfulImports++;

          console.log(`✅ Imported lead: ${savedLead.fullName} -> ${lead.assignedToUserId ? 'Assigned to Uploader' : 'Unassigned'}`);

        } catch (error) {
          result.errors.push(`Row ${rowNumber}: ${error.message}`);
          result.failedImports++;
          console.error(`❌ Error importing row ${rowNumber}:`, error.message);
        }
      }

      console.log(`📊 Import Complete: ${result.successfulImports} successful, ${result.failedImports} failed`);

      // Notify Manager if Sales Person imported leads
      if (shouldAutoAssignToUploader && result.successfulImports > 0) {
        try {
          const uploader = await this.userRepository.findOne({
            where: { id: user.userId },
            relations: ['assignedManager'],
          });

          if (uploader && uploader.assignedManager) {
            await this.crmNotificationService.notifyLeadsImported(
              uploader,
              uploader.assignedManager,
              result.successfulImports
            );
            console.log(`🔔 Notification sent to manager: ${uploader.assignedManager.fullName}`);
          } else {
            console.log('⚠️ No assigned manager found for notification.');
          }
        } catch (error) {
          console.error('❌ Failed to send manager notification:', error);
        }
      }

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`);
      console.error('❌ CSV import error:', error);
    }

    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Accept various phone formats: +92-XXX-XXXXXXX, +92XXXXXXXXX, 03XXXXXXXXX
    const phoneRegex = /^(\+92-?\d{3}-?\d{7}|03\d{9}|\+92\d{10})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private isTestData(row: any): boolean {
    // Check if this is test/dummy data
    const fullName = row.full_name || row.fullName || row['FULL NAME'] || '';
    const phone = row.phone_number || row.phone || row['PHONE'] || '';
    const email = row.email || row['EMAIL'] || '';

    return fullName.includes('<test lead:') ||
      phone.includes('<test lead:') ||
      email.includes('test@fb.com') ||
      fullName.includes('dummy data');
  }

  private parseFacebookLead(row: any): any {
    try {
      // Extract phone number from various possible columns
      // Format in CSV is likely p:+92...
      let phone = row.phone_number || row.phone || row['PHONE'] || '';

      if (phone.startsWith('p:')) {
        phone = phone.substring(2);
      }

      // Clean phone number
      phone = phone.replace(/[^\d+]/g, '');
      if (phone.startsWith('92') && !phone.startsWith('+92')) {
        phone = '+' + phone;
      } else if (phone.startsWith('03')) {
        phone = '+92' + phone.substring(1);
      }

      // Extract full name
      const fullName = row.full_name || row.fullName || row['FULL NAME'] || '';

      // Extract email
      const email = row.email || row['EMAIL'] || '';

      // Extract city
      const city = row.city || row['CITY'] || '';

      // Determine source based on platform
      let source = LeadSource.OTHER;
      const platform = row.platform || row['SOCIAL PLATFORMS'] || '';

      if (platform.toLowerCase() === 'fb' || platform.toLowerCase().includes('facebook')) {
        source = LeadSource.FACEBOOK_ADS;
      } else if (platform.toLowerCase() === 'ig' || platform.toLowerCase().includes('instagram')) {
        source = LeadSource.INSTAGRAM_ADS;
      } else if (row.is_organic === 'true') {
        source = LeadSource.WEBSITE;
      }

      // Create source details
      const sourceDetails = {
        platform: platform,
        plotSize: row['PLOT SIZE'] || '',
        paymentMethod: row['PAYMENT METHOD'] || '',
        leadStatus: row['LEAD STATUS'] || '',
        leadId: row.id || '',
      };

      // Determine priority based on budget/plot size if available
      let priority = LeadPriority.MEDIUM;
      // You could add logic here to set HIGH priority for larger plots (e.g. 1 kanal)

      // Use current time for imported leads
      const createdAt = new Date();

      // Create initial notes from extra columns
      const plotSize = row['PLOT SIZE'] ? `Plot Size: ${row['PLOT SIZE']}. ` : '';
      const paymentMethod = row['PAYMENT METHOD'] ? `Payment: ${row['PAYMENT METHOD']}. ` : '';

      // Capture Description/Details
      const description = row['DESCRIPTION'] || row['DETAILS'] || row['description'] || row['details'] || '';
      const descriptionText = description ? `\nDetails: ${description}` : '';

      const initialNotes = `${plotSize}${paymentMethod}Imported from ${platform || 'CSV'}${descriptionText}`;

      return {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone,
        source,
        sourceDetails: JSON.stringify(sourceDetails),
        priority,
        initialNotes,
        interests: row['PLOT SIZE'] ? `Plot Size: ${row['PLOT SIZE']}` : null,
        budgetRange: null,
        preferredContactMethod: 'phone',
        preferredContactTime: 'evening',
        createdAt
      };
    } catch (error) {
      console.error('Error parsing Facebook lead:', error);
      return null;
    }
  }

  private mapSource(source: string): LeadSource | null {
    const sourceMap: { [key: string]: LeadSource } = {
      'website': LeadSource.WEBSITE,
      'walk-in': LeadSource.WALK_IN,
      'walk_in': LeadSource.WALK_IN,
      'referral': LeadSource.REFERRAL,
      'social-media': LeadSource.FACEBOOK_ADS,
      'social_media': LeadSource.FACEBOOK_ADS,
      'advertisement': LeadSource.GOOGLE_ADS,
      'phone_call': LeadSource.PHONE_CALL,
      'phone-call': LeadSource.PHONE_CALL,
      'other': LeadSource.OTHER,
    };

    return sourceMap[source?.toLowerCase()] || null;
  }

  private mapPriority(budgetRange: string): LeadPriority {
    if (!budgetRange) return LeadPriority.MEDIUM;

    const budget = parseFloat(budgetRange);
    if (budget >= 15000000) return LeadPriority.HIGH;
    if (budget >= 5000000) return LeadPriority.MEDIUM;
    return LeadPriority.LOW;
  }

  private async selectSalesAgent(salesAgents: User[], lead: Lead): Promise<User | null> {
    if (salesAgents.length === 0) return null;

    // Get live workload data for all agents
    const agentsWithWorkload = await Promise.all(
      salesAgents.map(async (agent) => {
        const workloadData = await this.liveWorkloadService.getAgentWorkload(agent.id);
        return {
          agent,
          workloadScore: workloadData.workloadScore,
          // Add bonus for agents with lower workload
          assignmentScore: workloadData.workloadScore * 0.7 + Math.random() * 0.3
        };
      })
    );

    // Sort by assignment score (lower is better)
    agentsWithWorkload.sort((a, b) => a.assignmentScore - b.assignmentScore);

    return agentsWithWorkload[0].agent;
  }

  async getImportPreview(csvBuffer: Buffer): Promise<any> {
    const preview = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      testRows: 0,
      sampleData: [],
      errors: []
    };

    try {
      console.log('📊 Starting CSV preview with buffer size:', csvBuffer?.length || 'undefined');

      if (!csvBuffer) {
        preview.errors.push('No CSV buffer provided');
        return preview;
      }

      const leads: any[] = [];
      const csvString = csvBuffer.toString('utf-8');
      console.log('📊 CSV string length:', csvString.length);
      console.log('📊 First 200 chars:', csvString.substring(0, 200));

      const stream = Readable.from(csvString);

      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            console.log('📊 Parsed row:', Object.keys(row));
            leads.push(row);
            preview.totalRows++;
          })
          .on('end', () => {
            console.log('📊 CSV parsing completed, total rows:', preview.totalRows);
            resolve(undefined);
          })
          .on('error', (error) => {
            console.error('📊 CSV parsing error:', error);
            reject(error);
          });
      });

      console.log('📊 Processing first 10 rows for preview...');

      // Process first 10 rows for preview
      for (let i = 0; i < Math.min(leads.length, 10); i++) {
        const row = leads[i];
        console.log(`📊 Processing row ${i + 1}:`, {
          full_name: row.full_name,
          phone_number: row.phone_number,
          email: row.email,
          platform: row.platform,
          is_organic: row.is_organic
        });

        if (this.isTestData(row)) {
          console.log(`📊 Row ${i + 1} is test data, skipping`);
          preview.testRows++;
          continue;
        }

        const parsedLead = this.parseFacebookLead(row);
        if (parsedLead) {
          console.log(`📊 Row ${i + 1} parsed successfully:`, parsedLead.fullName);
          preview.validRows++;
          preview.sampleData.push({
            rowNumber: i + 1,
            fullName: parsedLead.fullName,
            email: parsedLead.email,
            phone: parsedLead.phone,
            source: parsedLead.source,
            priority: parsedLead.priority,
            city: row.city || 'N/A'
          });
        } else {
          console.log(`📊 Row ${i + 1} failed to parse`);
          preview.invalidRows++;
          preview.errors.push(`Row ${i + 1}: Invalid data format`);
        }
      }

    } catch (error) {
      console.error('📊 Preview error:', error);
      preview.errors.push(`Preview failed: ${error.message}`);
    }

    console.log('📊 Preview result:', preview);
    return preview;
  }

  async getSalesAgents(): Promise<any[]> {
    const salesAgents = await this.userRepository.find({
      where: {
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName', 'email']
    });

    // Get live workload data for each agent
    const agentsWithWorkload = await Promise.all(
      salesAgents.map(async (agent) => {
        const workloadData = await this.liveWorkloadService.getAgentWorkload(agent.id);
        return {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          workloadScore: workloadData.workloadScore,
          currentLeads: workloadData.activeLeads
        };
      })
    );

    // Sort by workload score (ascending)
    return agentsWithWorkload.sort((a, b) => a.workloadScore - b.workloadScore);
  }
}
