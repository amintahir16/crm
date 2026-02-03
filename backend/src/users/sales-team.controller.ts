import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { SalesTeamService } from './sales-team.service';
import { 
  CreateTeamMemberDto, 
  UpdateTeamMemberDto, 
  AssignLeadDto,
  TeamPerformanceFiltersDto 
} from './dto/sales-team.dto';

@Controller('sales-team')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesTeamController {
  constructor(private salesTeamService: SalesTeamService) {}

  @Get('members')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async getTeamMembers(@Request() req) {
    return await this.salesTeamService.getTeamMembers(req.user.userId);
  }

  @Get('members/:memberId')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async getTeamMemberDetails(
    @Request() req,
    @Param('memberId') memberId: string
  ) {
    return await this.salesTeamService.getTeamMemberDetails(req.user.userId, memberId);
  }

  @Post('members')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async createTeamMember(
    @Request() req,
    @Body() createDto: CreateTeamMemberDto
  ) {
    return await this.salesTeamService.createTeamMember(req.user.userId, createDto);
  }

  @Put('members/:memberId')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async updateTeamMember(
    @Request() req,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateTeamMemberDto
  ) {
    return await this.salesTeamService.updateTeamMember(req.user.userId, memberId, updateDto);
  }

  @Delete('members/:memberId')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async removeTeamMember(
    @Request() req,
    @Param('memberId') memberId: string
  ) {
    await this.salesTeamService.removeTeamMember(req.user.userId, memberId);
    return { message: 'Team member removed successfully' };
  }

  @Get('workload')
  @RequirePermissions(Permission.MANAGE_TEAM_MEMBERS)
  async getTeamWorkload(@Request() req) {
    return await this.salesTeamService.getTeamWorkload(req.user.userId);
  }

  @Get('next-available')
  @RequirePermissions(Permission.ASSIGN_LEADS)
  async getNextAvailableTeamMember(@Request() req) {
    const memberId = await this.salesTeamService.getNextAvailableTeamMember(req.user.userId);
    return { memberId };
  }

  @Post('assign-lead')
  @RequirePermissions(Permission.ASSIGN_LEADS)
  async assignLeadToTeamMember(
    @Request() req,
    @Body() assignDto: AssignLeadDto
  ) {
    await this.salesTeamService.assignLeadToTeamMember(req.user.userId, assignDto);
    return { message: 'Lead assigned successfully' };
  }

  @Get('performance')
  @RequirePermissions(Permission.VIEW_TEAM_ACTIVITIES)
  async getTeamPerformance(
    @Request() req,
    @Query() filters: TeamPerformanceFiltersDto
  ) {
    return await this.salesTeamService.getTeamPerformance(
      req.user.userId, 
      filters.startDate, 
      filters.endDate
    );
  }

  @Get('manager-stats')
  @RequirePermissions(Permission.VIEW_TEAM_ACTIVITIES)
  async getManagerStats(@Request() req) {
    return await this.salesTeamService.getManagerStats(req.user.userId);
  }

  @Get('agent-stats')
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async getAgentStats(@Request() req) {
    return await this.salesTeamService.getAgentStats(req.user.userId);
  }
}
