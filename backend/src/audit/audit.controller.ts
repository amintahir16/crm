import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntity, AuditSeverity } from './audit-log.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: AuditEntity,
    @Query('entityId') entityId?: string,
    @Query('severity') severity?: AuditSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      userId,
      action,
      entity,
      entityId,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    return await this.auditService.getAuditLogs(filters);
  }

  @Get('summary')
  async getAuditSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditService.getAuditSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('sensitive')
  async getSensitiveAuditLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditService.getSensitiveAuditLogs(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('high-severity')
  async getHighSeverityLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditService.getHighSeverityLogs(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('entity/:entity/:entityId')
  async getEntityAuditLogs(
    @Param('entity') entity: AuditEntity,
    @Param('entityId') entityId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditService.getAuditLogs({
      entity,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('user/:userId')
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.auditService.getAuditLogs({
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('export')
  async exportAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: AuditEntity,
    @Query('entityId') entityId?: string,
    @Query('severity') severity?: AuditSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.auditService.exportAuditLogs({
      userId,
      action,
      entity,
      entityId,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('cleanup')
  async cleanupOldLogs(@Query('daysToKeep') daysToKeep?: string) {
    const deletedCount = await this.auditService.cleanupOldLogs(
      daysToKeep ? parseInt(daysToKeep) : 365
    );
    return { message: `Cleaned up ${deletedCount} old audit logs` };
  }
}
