import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadActivityLog, LeadActivityType } from './lead-activity-log.entity';
import { Lead } from './lead.entity';
import { User } from '../users/user.entity';

@Injectable()
export class LeadActivityService {
  constructor(
    @InjectRepository(LeadActivityLog)
    private activityLogRepository: Repository<LeadActivityLog>,
  ) {}

  /**
   * Log an activity for a lead
   */
  async logActivity(
    leadId: string,
    activityType: LeadActivityType,
    description: string,
    userId?: string,
    metadata?: any,
  ): Promise<LeadActivityLog> {
    const activity = this.activityLogRepository.create({
      leadId,
      userId,
      activityType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return await this.activityLogRepository.save(activity);
  }

  /**
   * Log lead creation
   */
  async logLeadCreated(lead: Lead, createdBy?: User): Promise<void> {
    await this.logActivity(
      lead.id,
      LeadActivityType.CREATED,
      `Lead created: ${lead.fullName}`,
      createdBy?.id,
      {
        leadId: lead.leadId,
        fullName: lead.fullName,
        source: lead.source,
        assignedToUserId: lead.assignedToUserId,
      },
    );
  }

  /**
   * Log status change
   */
  async logStatusChange(
    lead: Lead,
    oldStatus: string,
    newStatus: string,
    changedBy?: User,
  ): Promise<void> {
    const leadName = lead.fullName || lead.leadId || 'Lead';
    const userName = changedBy?.fullName || 'User';
    const description = `${userName} changed status for ${leadName} from "${oldStatus}" to "${newStatus}"`;

    await this.logActivity(
      lead.id,
      LeadActivityType.STATUS_CHANGED,
      description,
      changedBy?.id,
      {
        oldStatus,
        newStatus,
        statusId: lead.statusId,
        leadName: lead.fullName,
        leadId: lead.leadId,
      },
    );
  }

  /**
   * Log assignment
   */
  async logAssignment(
    lead: Lead,
    oldAssignedUserId: string | null,
    newAssignedUserId: string | null,
    assignedBy?: User,
    oldAssignedUserName?: string,
    newAssignedUserName?: string,
  ): Promise<void> {
    const activityType = oldAssignedUserId
      ? LeadActivityType.REASSIGNED
      : LeadActivityType.ASSIGNED;

    const leadName = lead.fullName || lead.leadId || 'Lead';
    const userName = assignedBy?.fullName || 'User';
    const oldUserName = oldAssignedUserName || 'Previous User';
    const newUserName = newAssignedUserName || 'New User';

    const description = oldAssignedUserId
      ? `${userName} reassigned ${leadName} from ${oldUserName} to ${newUserName}`
      : `${userName} assigned ${leadName} to ${newUserName}`;

    await this.logActivity(
      lead.id,
      activityType,
      description,
      assignedBy?.id,
      {
        oldAssignedUserId,
        newAssignedUserId,
        oldAssignedUserName,
        newAssignedUserName,
        leadName: lead.fullName,
        leadId: lead.leadId,
      },
    );
  }

  /**
   * Log communication added
   */
  async logCommunication(
    lead: Lead,
    communicationType: string,
    addedBy?: User,
    outcome?: string,
  ): Promise<void> {
    const leadName = lead.fullName || lead.leadId || 'Lead';
    const userName = addedBy?.fullName || 'User';
    let description = `${userName} communicated with ${leadName} via ${communicationType}`;
    
    if (outcome) {
      description += ` (Outcome: ${outcome})`;
    }

    await this.logActivity(
      lead.id,
      LeadActivityType.COMMUNICATION_ADDED,
      description,
      addedBy?.id,
      {
        communicationType,
        outcome,
        leadName: lead.fullName,
        leadId: lead.leadId,
      },
    );
  }

  /**
   * Log note added
   */
  async logNoteAdded(lead: Lead, noteTitle: string, addedBy?: User): Promise<void> {
    const leadName = lead.fullName || lead.leadId || 'Lead';
    const userName = addedBy?.fullName || 'User';
    const description = `${userName} added a note for ${leadName}: "${noteTitle}"`;

    await this.logActivity(
      lead.id,
      LeadActivityType.NOTE_ADDED,
      description,
      addedBy?.id,
      {
        noteTitle,
        leadName: lead.fullName,
        leadId: lead.leadId,
      },
    );
  }

  /**
   * Log due date change
   */
  async logDueDateChange(
    lead: Lead,
    oldDueDate: Date | null,
    newDueDate: Date | null,
    changedBy?: User,
  ): Promise<void> {
    const activityType = oldDueDate
      ? LeadActivityType.DUE_DATE_CHANGED
      : LeadActivityType.DUE_DATE_SET;

    const description = oldDueDate
      ? `Due date changed from ${oldDueDate.toISOString().split('T')[0]} to ${newDueDate?.toISOString().split('T')[0] || 'None'}`
      : `Due date set to ${newDueDate?.toISOString().split('T')[0] || 'None'}`;

    await this.logActivity(
      lead.id,
      activityType,
      description,
      changedBy?.id,
      {
        oldDueDate: oldDueDate?.toISOString(),
        newDueDate: newDueDate?.toISOString(),
      },
    );
  }

  /**
   * Log priority change
   */
  async logPriorityChange(
    lead: Lead,
    oldPriority: string,
    newPriority: string,
    changedBy?: User,
  ): Promise<void> {
    await this.logActivity(
      lead.id,
      LeadActivityType.PRIORITY_CHANGED,
      `Priority changed from "${oldPriority}" to "${newPriority}"`,
      changedBy?.id,
      {
        oldPriority,
        newPriority,
      },
    );
  }

  /**
   * Log lead conversion
   */
  async logConversion(lead: Lead, customerId: string, convertedBy?: User): Promise<void> {
    await this.logActivity(
      lead.id,
      LeadActivityType.CONVERTED,
      `Lead converted to customer`,
      convertedBy?.id,
      {
        customerId,
      },
    );
  }

  /**
   * Log lead update
   */
  async logUpdate(lead: Lead, updatedFields: string[], updatedBy?: User): Promise<void> {
    await this.logActivity(
      lead.id,
      LeadActivityType.UPDATED,
      `Lead updated: ${updatedFields.join(', ')}`,
      updatedBy?.id,
      {
        updatedFields,
      },
    );
  }

  /**
   * Get all activities for a lead
   */
  async getLeadActivities(leadId: string): Promise<LeadActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { leadId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all activities for a user
   */
  async getUserActivities(userId: string, limit: number = 50): Promise<LeadActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { userId },
      relations: ['lead'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

