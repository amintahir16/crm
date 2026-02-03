import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { TeamActivityService } from './team-activity.service';

@Controller('team-activities')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamActivityController {
  constructor(private teamActivityService: TeamActivityService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TEAM_ACTIVITIES)
  async getTeamActivities(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('memberId') memberId?: string,
    @Query('activityType') activityType?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      memberId,
      activityType,
      page,
      limit
    };

    return await this.teamActivityService.getTeamActivities(req.user.userId, filters);
  }

  @Get('summary')
  @RequirePermissions(Permission.VIEW_TEAM_ACTIVITIES)
  async getTeamActivitySummary(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.teamActivityService.getTeamActivitySummary(
      req.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_TEAM_ACTIVITIES)
  async getTeamActivityStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.teamActivityService.getTeamActivityStats(
      req.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }
}
