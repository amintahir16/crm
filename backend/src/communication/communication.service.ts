import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority, NotificationStatus, NotificationChannel } from './notification.entity';
import { Message, MessageType, MessageStatus, MessageChannel } from './message.entity';
import { MessageAttachment } from './message.entity';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageAttachment)
    private attachmentRepository: Repository<MessageAttachment>,
  ) {}

  // Notification Management
  async createNotification(
    notificationData: {
      title: string;
      message: string;
      type: NotificationType;
      priority?: NotificationPriority;
      channel?: NotificationChannel;
      recipientId?: string;
      customerId?: string;
      bookingId?: string;
      senderId?: string;
      metadata?: any;
      actionData?: any;
      actionUrl?: string;
      scheduledFor?: Date;
      expiresAt?: Date;
      isBroadcast?: boolean;
      requiresAction?: boolean;
      category?: string;
      tags?: string[];
    },
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...notificationData,
      tags: notificationData.tags ? JSON.stringify(notificationData.tags) : null,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Send notification immediately if not scheduled
    if (!notificationData.scheduledFor) {
      await this.sendNotification(savedNotification);
    }

    return savedNotification;
  }

  async sendNotification(notification: Notification): Promise<void> {
    // Update sent timestamp
    await this.notificationRepository.update(notification.id, {
      sentAt: new Date(),
    });

    // Here you would integrate with actual notification services
    // For now, we'll just log the notification
    console.log(`Sending notification: ${notification.title} to ${notification.recipientId}`);
    
    // TODO: Integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - SMS service (Twilio, AWS SNS, etc.)
    // - Push notification service (Firebase, OneSignal, etc.)
    // - WhatsApp Business API
  }

  async getNotificationsForUser(
    userId: string,
    filters?: {
      status?: NotificationStatus;
      type?: NotificationType;
      priority?: NotificationPriority;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ notifications: Notification[]; total: number }> {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .leftJoinAndSelect('notification.customer', 'customer')
      .leftJoinAndSelect('notification.booking', 'booking')
      .where('notification.recipientId = :userId', { userId })
      .andWhere('notification.status != :deleted', { deleted: NotificationStatus.DELETED });

    if (filters) {
      if (filters.status) {
        query.andWhere('notification.status = :status', { status: filters.status });
      }
      if (filters.type) {
        query.andWhere('notification.type = :type', { type: filters.type });
      }
      if (filters.priority) {
        query.andWhere('notification.priority = :priority', { priority: filters.priority });
      }
      if (filters.unreadOnly) {
        query.andWhere('notification.status = :unread', { unread: NotificationStatus.UNREAD });
      }
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const notifications = await query
      .orderBy('notification.createdAt', 'DESC')
      .getMany();

    return { notifications, total };
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['sender', 'customer', 'booking'],
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.DELETED,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  // Message Management
  async createMessage(
    messageData: {
      subject: string;
      content: string;
      type: MessageType;
      channel: MessageChannel;
      senderId?: string;
      recipientId?: string;
      customerId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      metadata?: any;
      scheduledFor?: Date;
      isTemplate?: boolean;
      templateId?: string;
      templateVariables?: any;
      isBroadcast?: boolean;
      category?: string;
      tags?: string[];
    },
  ): Promise<Message> {
    const message = this.messageRepository.create({
      ...messageData,
      tags: messageData.tags ? JSON.stringify(messageData.tags) : null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Send message immediately if not scheduled
    if (!messageData.scheduledFor) {
      await this.sendMessage(savedMessage);
    }

    return savedMessage;
  }

  async sendMessage(message: Message): Promise<void> {
    try {
      // Update status to sent
      await this.messageRepository.update(message.id, {
        status: MessageStatus.SENT,
        sentAt: new Date(),
      });

      // Here you would integrate with actual messaging services
      console.log(`Sending ${message.channel} message: ${message.subject} to ${message.recipientEmail || message.recipientPhone}`);
      
      // TODO: Integrate with:
      // - Email service (SendGrid, AWS SES, etc.)
      // - SMS service (Twilio, AWS SNS, etc.)
      // - WhatsApp Business API
      // - Push notification service

      // Simulate delivery
      setTimeout(async () => {
        await this.messageRepository.update(message.id, {
          status: MessageStatus.DELIVERED,
          deliveredAt: new Date(),
        });
      }, 1000);

    } catch (error) {
      await this.messageRepository.update(message.id, {
        status: MessageStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }

  async getMessagesForUser(
    userId: string,
    filters?: {
      status?: MessageStatus;
      type?: MessageType;
      channel?: MessageChannel;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ messages: Message[]; total: number }> {
    const query = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.customer', 'customer')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .where('message.recipientId = :userId', { userId });

    if (filters) {
      if (filters.status) {
        query.andWhere('message.status = :status', { status: filters.status });
      }
      if (filters.type) {
        query.andWhere('message.type = :type', { type: filters.type });
      }
      if (filters.channel) {
        query.andWhere('message.channel = :channel', { channel: filters.channel });
      }
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const messages = await query
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    return { messages, total };
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    await this.messageRepository.update(messageId, {
      status: MessageStatus.READ,
      readAt: new Date(),
    });

    return await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'customer', 'attachments'],
    });
  }

  // Automated Notifications
  async sendPaymentReminder(bookingId: string, customerId: string, amount: number, dueDate: Date): Promise<void> {
    await this.createNotification({
      title: 'Payment Reminder',
      message: `Your payment of ${amount} PKR is due on ${dueDate.toLocaleDateString()}. Please make the payment to avoid late fees.`,
      type: NotificationType.PAYMENT_REMINDER,
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.EMAIL,
      customerId,
      bookingId,
      actionUrl: `/dashboard/payments?bookingId=${bookingId}`,
      requiresAction: true,
      category: 'payment',
    });
  }

  async sendPaymentOverdueAlert(bookingId: string, customerId: string, amount: number, daysOverdue: number): Promise<void> {
    await this.createNotification({
      title: 'Payment Overdue',
      message: `Your payment of ${amount} PKR is ${daysOverdue} days overdue. Please contact us immediately to resolve this issue.`,
      type: NotificationType.PAYMENT_OVERDUE,
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.SMS,
      customerId,
      bookingId,
      actionUrl: `/dashboard/payments?bookingId=${bookingId}`,
      requiresAction: true,
      category: 'payment',
    });
  }

  async sendConstructionUpdate(projectId: string, customerId: string, update: string): Promise<void> {
    await this.createNotification({
      title: 'Construction Update',
      message: `Update on your construction project: ${update}`,
      type: NotificationType.CONSTRUCTION_UPDATE,
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.IN_APP,
      customerId,
      actionUrl: `/dashboard/construction/${projectId}`,
      category: 'construction',
    });
  }

  async sendDocumentApprovalNotification(
    documentId: string,
    userId: string,
    approved: boolean,
    documentName: string,
  ): Promise<void> {
    await this.createNotification({
      title: approved ? 'Document Approved' : 'Document Rejected',
      message: `Your document "${documentName}" has been ${approved ? 'approved' : 'rejected'}.`,
      type: approved ? NotificationType.DOCUMENT_APPROVED : NotificationType.DOCUMENT_REJECTED,
      priority: NotificationPriority.MEDIUM,
      channel: NotificationChannel.IN_APP,
      recipientId: userId,
      actionUrl: `/dashboard/documents/${documentId}`,
      category: 'document',
    });
  }

  // Analytics
  async getCommunicationAnalytics(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<NotificationType, number>;
    notificationsByPriority: Record<NotificationPriority, number>;
    totalMessages: number;
    messagesByChannel: Record<MessageChannel, number>;
    messagesByStatus: Record<MessageStatus, number>;
    deliveryRate: number;
    readRate: number;
  }> {
    const notifications = await this.notificationRepository.find();
    const messages = await this.messageRepository.find();

    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter(n => n.status === NotificationStatus.UNREAD).length;

    // Group notifications by type
    const notificationsByType = {} as Record<NotificationType, number>;
    Object.values(NotificationType).forEach(type => {
      notificationsByType[type] = notifications.filter(n => n.type === type).length;
    });

    // Group notifications by priority
    const notificationsByPriority = {} as Record<NotificationPriority, number>;
    Object.values(NotificationPriority).forEach(priority => {
      notificationsByPriority[priority] = notifications.filter(n => n.priority === priority).length;
    });

    const totalMessages = messages.length;

    // Group messages by channel
    const messagesByChannel = {} as Record<MessageChannel, number>;
    Object.values(MessageChannel).forEach(channel => {
      messagesByChannel[channel] = messages.filter(m => m.channel === channel).length;
    });

    // Group messages by status
    const messagesByStatus = {} as Record<MessageStatus, number>;
    Object.values(MessageStatus).forEach(status => {
      messagesByStatus[status] = messages.filter(m => m.status === status).length;
    });

    const deliveredMessages = messages.filter(m => m.status === MessageStatus.DELIVERED).length;
    const readMessages = messages.filter(m => m.status === MessageStatus.READ).length;

    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      totalMessages,
      messagesByChannel,
      messagesByStatus,
      deliveryRate,
      readRate,
    };
  }
}
