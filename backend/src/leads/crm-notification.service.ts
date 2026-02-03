import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmNotification, NotificationType } from './crm-notification.entity';
import { User } from '../users/user.entity';
import { Lead } from './lead.entity';

@Injectable()
export class CrmNotificationService {
  constructor(
    @InjectRepository(CrmNotification)
    private notificationRepository: Repository<CrmNotification>,
  ) {}

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
  ): Promise<CrmNotification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Notify about lead due today
   */
  async notifyLeadDueToday(lead: Lead, assignedUser: User): Promise<void> {
    await this.createNotification(
      assignedUser.id,
      NotificationType.LEAD_DUE_TODAY,
      `Lead Due Today: ${lead.fullName}`,
      `Lead "${lead.fullName}" (${lead.leadId || lead.id}) is due today. Please follow up.`,
      'lead',
      lead.id,
    );
  }

  /**
   * Notify about lead due date passed
   */
  async notifyLeadDuePassed(lead: Lead, assignedUser: User): Promise<void> {
    await this.createNotification(
      assignedUser.id,
      NotificationType.LEAD_DUE_PASSED,
      `Overdue Lead: ${lead.fullName}`,
      `Lead "${lead.fullName}" (${lead.leadId || lead.id}) is overdue. Please follow up immediately.`,
      'lead',
      lead.id,
    );
  }

  /**
   * Notify about new lead assignment
   */
  async notifyLeadAssigned(lead: Lead, assignedUser: User, assignedBy?: User): Promise<void> {
    const assignedByName = assignedBy ? ` by ${assignedBy.fullName}` : '';
    await this.createNotification(
      assignedUser.id,
      NotificationType.LEAD_ASSIGNED,
      `New Lead Assigned: ${lead.fullName}`,
      `You have been assigned a new lead: "${lead.fullName}" (${lead.leadId || lead.id})${assignedByName}.`,
      'lead',
      lead.id,
    );
  }

  /**
   * Notify about lead reassignment
   */
  async notifyLeadReassigned(
    lead: Lead,
    newAssignedUser: User,
    oldAssignedUser?: User,
    reassignedBy?: User,
  ): Promise<void> {
    const reassignedByName = reassignedBy ? ` by ${reassignedBy.fullName}` : '';
    const oldAssignedName = oldAssignedUser ? ` from ${oldAssignedUser.fullName}` : '';
    
    await this.createNotification(
      newAssignedUser.id,
      NotificationType.LEAD_REASSIGNED,
      `Lead Reassigned: ${lead.fullName}`,
      `Lead "${lead.fullName}" (${lead.leadId || lead.id}) has been reassigned to you${oldAssignedName}${reassignedByName}.`,
      'lead',
      lead.id,
    );

    // Also notify old assigned user if different
    if (oldAssignedUser && oldAssignedUser.id !== newAssignedUser.id) {
      await this.createNotification(
        oldAssignedUser.id,
        NotificationType.LEAD_REASSIGNED,
        `Lead Reassigned: ${lead.fullName}`,
        `Lead "${lead.fullName}" (${lead.leadId || lead.id}) has been reassigned from you to ${newAssignedUser.fullName}.`,
        'lead',
        lead.id,
      );
    }
  }

  /**
   * Notify about status change (to manager)
   */
  async notifyStatusChanged(
    lead: Lead,
    manager: User,
    oldStatus: string,
    newStatus: string,
    changedBy: User,
  ): Promise<void> {
    await this.createNotification(
      manager.id,
      NotificationType.LEAD_STATUS_CHANGED,
      `Lead Status Changed: ${lead.fullName}`,
      `${changedBy.fullName} changed lead "${lead.fullName}" status from "${oldStatus}" to "${newStatus}".`,
      'lead',
      lead.id,
    );
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
  ): Promise<CrmNotification[]> {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      isRead: true,
      readAt: new Date(),
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }
}

