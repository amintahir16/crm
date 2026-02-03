import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions, Permission } from '../auth/permissions.guard';
import { SalesActivityService, CreateSalesActivityDto } from './sales-activity.service';
import { UserRole } from './user.entity';

@Controller('sales-activities')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesActivityController {
  constructor(private salesActivityService: SalesActivityService) {}

  @Post()
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async logActivity(
    @Body() createDto: CreateSalesActivityDto,
    @Request() req,
  ) {
    // Ensure sales person can only log their own activities
    if (req.user.role === UserRole.SALES_PERSON) {
      createDto.userId = req.user.userId;
    }
    
    return await this.salesActivityService.logActivity(createDto);
  }

  @Get('my-activities')
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async getMyActivities(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const limitNum = limit ? parseInt(limit) : 50;

    return await this.salesActivityService.getUserActivities(
      req.user.userId,
      start,
      end,
      limitNum,
    );
  }

  @Get('my-stats')
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async getMyStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.salesActivityService.getUserActivityStats(
      req.user.userId,
      start,
      end,
    );
  }

  @Get('my-trends')
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async getMyTrends(
    @Request() req,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days) : 30;
    return await this.salesActivityService.getActivityTrends(req.user.userId, daysNum);
  }

  @Get('user/:userId/activities')
  @RequirePermissions(Permission.MANAGE_SALES_TEAM)
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const limitNum = limit ? parseInt(limit) : 50;

    return await this.salesActivityService.getUserActivities(
      userId,
      start,
      end,
      limitNum,
    );
  }

  @Get('user/:userId/stats')
  @RequirePermissions(Permission.MANAGE_SALES_TEAM)
  async getUserStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.salesActivityService.getUserActivityStats(
      userId,
      start,
      end,
    );
  }

  @Get('team-stats')
  @RequirePermissions(Permission.MANAGE_SALES_TEAM)
  async getTeamStats(
    @Query('userIds') userIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const teamUserIds = userIds.split(',');
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.salesActivityService.getTeamActivityStats(
      teamUserIds,
      start,
      end,
    );
  }

  @Get('top-performers')
  @RequirePermissions(Permission.MANAGE_SALES_TEAM)
  async getTopPerformers(
    @Query('userIds') userIds: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metric') metric?: 'leadsConverted' | 'totalPotentialValue' | 'totalActivities',
  ) {
    const teamUserIds = userIds.split(',');
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.salesActivityService.getTopPerformers(
      teamUserIds,
      start,
      end,
      metric || 'leadsConverted',
    );
  }
}
