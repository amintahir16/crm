import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { SalesActivity } from './sales-activity.entity';
import { ActivityLog } from '../common/activity-log.entity';

@Injectable()
export class TeamActivityService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SalesActivity)
    private salesActivityRepository: Repository<SalesActivity>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Get all activities for team members managed by a sales manager
   */
  async getTeamActivities(
    managerId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      memberId?: string;
      activityType?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { startDate, endDate, memberId, activityType, page = 1, limit = 20 } = filters;

    // Get team members
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        data: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }

    // Build query for sales activities
    let salesQuery = this.salesActivityRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.userId IN (:...teamMemberIds)', { teamMemberIds });

    if (memberId) {
      salesQuery = salesQuery.andWhere('activity.userId = :memberId', { memberId });
    }

    if (activityType) {
      salesQuery = salesQuery.andWhere('activity.activityType = :activityType', { activityType });
    }

    if (startDate) {
      salesQuery = salesQuery.andWhere('activity.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      salesQuery = salesQuery.andWhere('activity.createdAt <= :endDate', { endDate });
    }

    const skip = (page - 1) * limit;
    const [salesActivities, salesTotal] = await salesQuery
      .orderBy('activity.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Build query for general activity logs
    let activityQuery = this.activityLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.userId IN (:...teamMemberIds)', { teamMemberIds });

    if (memberId) {
      activityQuery = activityQuery.andWhere('log.userId = :memberId', { memberId });
    }

    if (startDate) {
      activityQuery = activityQuery.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      activityQuery = activityQuery.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const [activityLogs, activityTotal] = await activityQuery
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Combine and sort all activities
    const allActivities = [
      ...salesActivities.map(activity => ({
        id: activity.id,
        type: 'sales_activity',
        activityType: activity.activityType,
        description: activity.description,
        userId: activity.userId,
        userName: activity.user.fullName,
        createdAt: activity.createdAt,
        metadata: activity.metadata,
        potentialValue: activity.potentialValue,
        duration: activity.duration,
        isSuccessful: activity.isSuccessful,
        notes: activity.notes
      })),
      ...activityLogs.map(log => ({
        id: log.id,
        type: 'activity_log',
        activityType: log.action,
        description: `${log.action} on ${log.entityType}`,
        userId: log.userId,
        userName: log.user.fullName,
        createdAt: log.createdAt,
        metadata: { entityType: log.entityType, entityId: log.entityId, oldValues: log.oldValues, newValues: log.newValues }
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = salesTotal + activityTotal;
    const paginatedActivities = allActivities.slice(0, limit);

    return {
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      teamMembers: teamMembers.map(member => ({
        id: member.id,
        name: member.fullName
      }))
    };
  }

  /**
   * Get activity summary for team members
   */
  async getTeamActivitySummary(managerId: string, startDate?: Date, endDate?: Date) {
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return [];
    }

    const summary = await Promise.all(
      teamMembers.map(async (member) => {
        let salesQuery = this.salesActivityRepository.createQueryBuilder('activity')
          .where('activity.userId = :memberId', { memberId: member.id });

        let activityQuery = this.activityLogRepository.createQueryBuilder('log')
          .where('log.userId = :memberId', { memberId: member.id });

        if (startDate) {
          salesQuery = salesQuery.andWhere('activity.createdAt >= :startDate', { startDate });
          activityQuery = activityQuery.andWhere('log.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
          salesQuery = salesQuery.andWhere('activity.createdAt <= :endDate', { endDate });
          activityQuery = activityQuery.andWhere('log.createdAt <= :endDate', { endDate });
        }

        const [salesCount, activityCount] = await Promise.all([
          salesQuery.getCount(),
          activityQuery.getCount()
        ]);

        // Get recent activities
        const recentActivities = await this.salesActivityRepository.find({
          where: { userId: member.id },
          order: { createdAt: 'DESC' },
          take: 5,
          select: ['activityType', 'description', 'createdAt', 'isSuccessful']
        });

        return {
          memberId: member.id,
          memberName: member.fullName,
          totalActivities: salesCount + activityCount,
          salesActivities: salesCount,
          generalActivities: activityCount,
          recentActivities: recentActivities.map(activity => ({
            type: activity.activityType,
            description: activity.description,
            createdAt: activity.createdAt,
            isSuccessful: activity.isSuccessful
          }))
        };
      })
    );

    return summary;
  }

  /**
   * Get activity statistics for team performance
   */
  async getTeamActivityStats(managerId: string, startDate?: Date, endDate?: Date) {
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        totalMembers: 0,
        totalActivities: 0,
        averageActivitiesPerMember: 0,
        mostActiveMember: null,
        activityBreakdown: {}
      };
    }

    let salesQuery = this.salesActivityRepository.createQueryBuilder('activity')
      .where('activity.userId IN (:...teamMemberIds)', { teamMemberIds });

    let activityQuery = this.activityLogRepository.createQueryBuilder('log')
      .where('log.userId IN (:...teamMemberIds)', { teamMemberIds });

    if (startDate) {
      salesQuery = salesQuery.andWhere('activity.createdAt >= :startDate', { startDate });
      activityQuery = activityQuery.andWhere('log.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      salesQuery = salesQuery.andWhere('activity.createdAt <= :endDate', { endDate });
      activityQuery = activityQuery.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const [salesActivities, activityLogs] = await Promise.all([
      salesQuery.getMany(),
      activityQuery.getMany()
    ]);

    const totalActivities = salesActivities.length + activityLogs.length;
    const averageActivitiesPerMember = totalActivities / teamMembers.length;

    // Find most active member
    const memberActivityCounts = teamMembers.map(member => {
      const salesCount = salesActivities.filter(a => a.userId === member.id).length;
      const activityCount = activityLogs.filter(a => a.userId === member.id).length;
      return {
        memberId: member.id,
        memberName: member.fullName,
        totalActivities: salesCount + activityCount
      };
    });

    const mostActiveMember = memberActivityCounts.reduce((prev, current) => 
      prev.totalActivities > current.totalActivities ? prev : current
    );

    // Activity breakdown by type
    const activityBreakdown = salesActivities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMembers: teamMembers.length,
      totalActivities,
      averageActivitiesPerMember,
      mostActiveMember: mostActiveMember.totalActivities > 0 ? mostActiveMember : null,
      activityBreakdown,
      memberActivityCounts
    };
  }
}
