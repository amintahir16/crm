import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity, AuditSeverity } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    action: AuditAction,
    entity: AuditEntity,
    description: string,
    options: {
      entityId?: string;
      oldValues?: any;
      newValues?: any;
      severity?: AuditSeverity;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      metadata?: any;
      isSensitive?: boolean;
    } = {},
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entity,
      entityId: options.entityId,
      oldValues: options.oldValues ? JSON.stringify(options.oldValues) : null,
      newValues: options.newValues ? JSON.stringify(options.newValues) : null,
      description,
      severity: options.severity || AuditSeverity.LOW,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      sessionId: options.sessionId,
      metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      isSensitive: options.isSensitive || false,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      action?: AuditAction;
      entity?: AuditEntity;
      entityId?: string;
      severity?: AuditSeverity;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.entity) {
      queryBuilder.andWhere('audit.entity = :entity', { entity: filters.entity });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.severity) {
      queryBuilder.andWhere('audit.severity = :severity', { severity: filters.severity });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditSummary(
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    // Get action counts
    const actionCounts = await queryBuilder
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .getRawMany();

    // Get entity counts
    const entityCounts = await queryBuilder
      .select('audit.entity', 'entity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.entity')
      .getRawMany();

    // Get severity counts
    const severityCounts = await queryBuilder
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.severity')
      .getRawMany();

    // Get daily activity
    const dailyActivity = await queryBuilder
      .select('DATE(audit.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE(audit.createdAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      actionCounts,
      entityCounts,
      severityCounts,
      dailyActivity,
    };
  }

  async getSensitiveAuditLogs(
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.isSensitive = :isSensitive', { isSensitive: true });

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }

  async getHighSeverityLogs(
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.severity IN (:...severities)', { 
        severities: [AuditSeverity.HIGH, AuditSeverity.CRITICAL] 
      });

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }

  async getAuditLogById(logId: string): Promise<AuditLog> {
    return await this.auditLogRepository.findOne({
      where: { id: logId },
      relations: ['user'],
    });
  }

  async exportAuditLogs(
    filters: {
      userId?: string;
      action?: AuditAction;
      entity?: AuditEntity;
      entityId?: string;
      severity?: AuditSeverity;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.entity) {
      queryBuilder.andWhere('audit.entity = :entity', { entity: filters.entity });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.severity) {
      queryBuilder.andWhere('audit.severity = :severity', { severity: filters.severity });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return await queryBuilder.getMany();
  }

  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
