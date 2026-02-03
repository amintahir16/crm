import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Request
} from '@nestjs/common';
import { LeadsService, CreateLeadDto, UpdateLeadDto, CreateCommunicationDto, CreateNoteDto, LeadFilters } from './leads.service';
import { LeadWorkflowService } from './lead-workflow.service';
import { LeadActivityService } from './lead-activity.service';
import { CrmNotificationService } from './crm-notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { LeadStatus, LeadSource, LeadPriority } from './lead.entity';
import { ForbiddenException } from '@nestjs/common';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadWorkflowService: LeadWorkflowService,
    private readonly activityService: LeadActivityService,
    private readonly notificationService: CrmNotificationService,
  ) {}

  @Post()
  @RequirePermissions(Permission.CREATE_LEADS)
  async createLead(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    // Auto-assign to current user if they are a sales agent and no assignment is specified
    if (req.user.role === 'sales_person' && !createLeadDto.assignedToUserId) {
      createLeadDto.assignedToUserId = req.user.userId;
    }
    
    return await this.leadsService.createLead(createLeadDto, req.user);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_LEADS)
  async getAllLeads(
    @Request() req,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId,
      generatedByUserId,
      search,
    };

    return await this.leadsService.getAllLeads(filters, page, limit, sortBy, sortOrder, {
      userId: req.user.userId,
      role: req.user.role
    });
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_LEAD_ANALYTICS)
  async getLeadStats(
    @Request() req,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId,
      generatedByUserId,
    };

    return await this.leadsService.getLeadStats(filters, {
      userId: req.user.userId,
      role: req.user.role
    });
  }

  @Get('by-source')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  async getLeadsBySource(
    @Query('status') status?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('generatedByUserId') generatedByUserId?: string,
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      assignedToUserId,
      generatedByUserId,
    };

    return await this.leadsService.getLeadsBySource(filters);
  }

  @Get('my-leads')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getMyLeads(
    @Request() req,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const filters: LeadFilters = {
      status: status ? status.split(',') as LeadStatus[] : undefined,
      source: source ? source.split(',') as LeadSource[] : undefined,
      priority: priority ? priority.split(',') as LeadPriority[] : undefined,
      assignedToUserId: req.user.userId,
      search,
    };

    return await this.leadsService.getAllLeads(filters, page, limit, sortBy, sortOrder);
  }

  // Lead statuses endpoints (must come before :id routes)
  @Get('statuses')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadStatuses() {
    return await this.leadsService.getLeadStatuses();
  }

  @Get('status-metrics')
  @RequirePermissions(Permission.VIEW_LEAD_ANALYTICS)
  async getLeadStatusMetrics(
    @Request() req,
    @Query('assignedToUserId') assignedToUserId?: string,
  ) {
    const filters: LeadFilters = {
      assignedToUserId,
    };
    return await this.leadsService.getLeadStatusMetrics(filters, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  // Notification endpoints (must come before :id routes)
  @Get('notifications')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getNotifications(
    @Request() req,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    return await this.notificationService.getUserNotifications(
      req.user.userId,
      unreadOnly === 'true',
      limit,
    );
  }

  @Get('notifications/unread-count')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.leadsService.getLeadById(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.EDIT_LEADS)
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ) {
    // Sales person cannot change assignment or due date
    if (req.user.role === 'sales_person') {
      if (updateLeadDto.assignedToUserId !== undefined) {
        throw new ForbiddenException('Sales person cannot change lead assignment');
      }
      if (updateLeadDto.dueDate !== undefined) {
        throw new ForbiddenException('Sales person cannot change due date');
      }
    }

    return await this.leadsService.updateLead(id, updateLeadDto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_LEADS)
  async deleteLead(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Sales person cannot delete leads
    if (req.user.role === 'sales_person') {
      throw new ForbiddenException('Sales person cannot delete leads');
    }
    await this.leadsService.deleteLead(id, req.user);
    return { message: 'Lead deleted successfully' };
  }

  @Post(':id/convert')
  @RequirePermissions(Permission.CONVERT_LEADS)
  async convertLeadToCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() customerData: { cnic: string; address: string },
    @Request() req,
  ) {
    return await this.leadsService.convertLeadToCustomer(id, customerData, req.user.userId);
  }

  // Communication endpoints
  @Post(':id/communications')
  @RequirePermissions(Permission.EDIT_LEADS)
  async addCommunication(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Body() createCommunicationDto: Omit<CreateCommunicationDto, 'leadId' | 'userId'>,
    @Request() req,
  ) {
    return await this.leadsService.addCommunication({
      ...createCommunicationDto,
      leadId,
      userId: req.user.userId,
    }, req.user);
  }

  @Get(':id/communications')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadCommunications(@Param('id', ParseUUIDPipe) leadId: string) {
    return await this.leadsService.getLeadCommunications(leadId);
  }

  // Note endpoints
  @Post(':id/notes')
  @RequirePermissions(Permission.EDIT_LEADS)
  async addNote(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Body() createNoteDto: Omit<CreateNoteDto, 'leadId' | 'userId'>,
    @Request() req,
  ) {
    return await this.leadsService.addNote({
      ...createNoteDto,
      leadId,
      userId: req.user.userId,
    }, req.user);
  }

  @Get(':id/notes')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadNotes(
    @Param('id', ParseUUIDPipe) leadId: string,
    @Request() req,
  ) {
    return await this.leadsService.getLeadNotes(leadId, req.user.userId);
  }

  // Workflow endpoints
  @Post('workflow/process')
  @RequirePermissions(Permission.VIEW_LEADS)
  async processWorkflow(@Request() req) {
    console.log('Manual workflow processing triggered by:', req.user.email);
    await this.leadWorkflowService.processWorkflowAutomation();
    return { message: 'Workflow automation completed successfully' };
  }

  @Get('workflow/stats')
  @RequirePermissions(Permission.VIEW_LEAD_ANALYTICS)
  async getWorkflowStats(@Request() req) {
    return await this.leadWorkflowService.getWorkflowStats();
  }

  // Activity timeline endpoints
  @Get(':id/activities')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getLeadActivities(@Param('id', ParseUUIDPipe) leadId: string) {
    return await this.activityService.getLeadActivities(leadId);
  }

  @Get('users/:userId/activities')
  @RequirePermissions(Permission.VIEW_LEADS)
  async getUserActivities(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    return await this.activityService.getUserActivities(userId, limit);
  }

  @Put('notifications/:id/read')
  @RequirePermissions(Permission.VIEW_LEADS)
  async markNotificationAsRead(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificationService.markAsRead(id);
    return { message: 'Notification marked as read' };
  }

  @Put('notifications/read-all')
  @RequirePermissions(Permission.VIEW_LEADS)
  async markAllNotificationsAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  // Update lead status
  @Put(':id/status')
  @RequirePermissions(Permission.EDIT_LEADS)
  async updateLeadStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { statusId: string },
    @Request() req,
  ) {
    return await this.leadsService.updateLeadStatus(id, body.statusId, req.user);
  }
}
