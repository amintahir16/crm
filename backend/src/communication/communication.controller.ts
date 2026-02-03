import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus, 
  NotificationChannel 
} from './notification.entity';
import { 
  Message, 
  MessageType, 
  MessageStatus, 
  MessageChannel 
} from './message.entity';

@UseGuards(JwtAuthGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // Notification Management
  @Post('notifications')
  async createNotification(
    @Body() createNotificationDto: {
      title: string;
      message: string;
      type: NotificationType;
      priority?: NotificationPriority;
      channel?: NotificationChannel;
      recipientId?: string;
      customerId?: string;
      bookingId?: string;
      metadata?: any;
      actionData?: any;
      actionUrl?: string;
      scheduledFor?: string;
      expiresAt?: string;
      isBroadcast?: boolean;
      requiresAction?: boolean;
      category?: string;
      tags?: string[];
    },
    @GetUser() user: User,
  ): Promise<Notification> {
    return this.communicationService.createNotification({
      ...createNotificationDto,
      senderId: user.id,
      scheduledFor: createNotificationDto.scheduledFor ? new Date(createNotificationDto.scheduledFor) : undefined,
      expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined,
    });
  }

  @Get('notifications')
  async getNotificationsForUser(
    @GetUser() user: User,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.communicationService.getNotificationsForUser(user.id, {
      status,
      type,
      priority,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Put('notifications/:id/read')
  async markNotificationAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<Notification> {
    return this.communicationService.markNotificationAsRead(notificationId);
  }

  @Put('notifications/read-all')
  async markAllNotificationsAsRead(
    @GetUser() user: User,
  ): Promise<{ markedCount: number }> {
    const markedCount = await this.communicationService.markAllNotificationsAsRead(user.id);
    return { markedCount };
  }

  @Delete('notifications/:id')
  async deleteNotification(
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<{ message: string }> {
    await this.communicationService.deleteNotification(notificationId);
    return { message: 'Notification deleted successfully' };
  }

  @Get('notifications/unread-count')
  async getUnreadCount(
    @GetUser() user: User,
  ): Promise<{ count: number }> {
    const count = await this.communicationService.getUnreadCount(user.id);
    return { count };
  }

  // Message Management
  @Post('messages')
  async createMessage(
    @Body() createMessageDto: {
      subject: string;
      content: string;
      type: MessageType;
      channel: MessageChannel;
      recipientId?: string;
      customerId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      metadata?: any;
      scheduledFor?: string;
      isTemplate?: boolean;
      templateId?: string;
      templateVariables?: any;
      isBroadcast?: boolean;
      category?: string;
      tags?: string[];
    },
    @GetUser() user: User,
  ): Promise<Message> {
    return this.communicationService.createMessage({
      ...createMessageDto,
      senderId: user.id,
      scheduledFor: createMessageDto.scheduledFor ? new Date(createMessageDto.scheduledFor) : undefined,
    });
  }

  @Get('messages')
  async getMessagesForUser(
    @GetUser() user: User,
    @Query('status') status?: MessageStatus,
    @Query('type') type?: MessageType,
    @Query('channel') channel?: MessageChannel,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ messages: Message[]; total: number }> {
    return this.communicationService.getMessagesForUser(user.id, {
      status,
      type,
      channel,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Put('messages/:id/read')
  async markMessageAsRead(
    @Param('id', ParseUUIDPipe) messageId: string,
  ): Promise<Message> {
    return this.communicationService.markMessageAsRead(messageId);
  }

  // Automated Notifications
  @Post('notifications/payment-reminder')
  async sendPaymentReminder(
    @Body() reminderDto: {
      bookingId: string;
      customerId: string;
      amount: number;
      dueDate: string;
    },
  ): Promise<{ message: string }> {
    await this.communicationService.sendPaymentReminder(
      reminderDto.bookingId,
      reminderDto.customerId,
      reminderDto.amount,
      new Date(reminderDto.dueDate),
    );
    return { message: 'Payment reminder sent successfully' };
  }

  @Post('notifications/payment-overdue')
  async sendPaymentOverdueAlert(
    @Body() overdueDto: {
      bookingId: string;
      customerId: string;
      amount: number;
      daysOverdue: number;
    },
  ): Promise<{ message: string }> {
    await this.communicationService.sendPaymentOverdueAlert(
      overdueDto.bookingId,
      overdueDto.customerId,
      overdueDto.amount,
      overdueDto.daysOverdue,
    );
    return { message: 'Payment overdue alert sent successfully' };
  }

  @Post('notifications/construction-update')
  async sendConstructionUpdate(
    @Body() updateDto: {
      projectId: string;
      customerId: string;
      update: string;
    },
  ): Promise<{ message: string }> {
    await this.communicationService.sendConstructionUpdate(
      updateDto.projectId,
      updateDto.customerId,
      updateDto.update,
    );
    return { message: 'Construction update sent successfully' };
  }

  @Post('notifications/document-approval')
  async sendDocumentApprovalNotification(
    @Body() approvalDto: {
      documentId: string;
      userId: string;
      approved: boolean;
      documentName: string;
    },
  ): Promise<{ message: string }> {
    await this.communicationService.sendDocumentApprovalNotification(
      approvalDto.documentId,
      approvalDto.userId,
      approvalDto.approved,
      approvalDto.documentName,
    );
    return { message: 'Document approval notification sent successfully' };
  }

  // Analytics
  @Get('analytics')
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
    return this.communicationService.getCommunicationAnalytics();
  }
}
