import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesActivity, SalesActivityType } from './sales-activity.entity';

export interface CreateSalesActivityDto {
  userId: string;
  activityType: SalesActivityType;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  potentialValue?: number;
  duration?: number;
  isSuccessful?: boolean;
  notes?: string;
}

export interface SalesActivityStats {
  totalActivities: number;
  leadsCreated: number;
  leadsConverted: number;
  customersCreated: number;
  bookingsCreated: number;
  callsMade: number;
  emailsSent: number;
  meetingsHeld: number;
  totalPotentialValue: number;
  averageActivityDuration: number;
  successRate: number;
}

@Injectable()
export class SalesActivityService {
  constructor(
    @InjectRepository(SalesActivity)
    private salesActivityRepository: Repository<SalesActivity>,
  ) {}

  async logActivity(createDto: CreateSalesActivityDto): Promise<SalesActivity> {
    const activity = this.salesActivityRepository.create(createDto);
    return await this.salesActivityRepository.save(activity);
  }

  async getUserActivities(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
  ): Promise<SalesActivity[]> {
    const query = this.salesActivityRepository.createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .orderBy('activity.createdAt', 'DESC')
      .limit(limit);

    if (startDate && endDate) {
      query.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await query.getMany();
  }

  async getUserActivityStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SalesActivityStats> {
    const query = this.salesActivityRepository.createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    if (startDate && endDate) {
      query.andWhere('activity.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const activities = await query.getMany();

    const stats: SalesActivityStats = {
      totalActivities: activities.length,
      leadsCreated: activities.filter(a => a.activityType === SalesActivityType.LEAD_CREATED).length,
      leadsConverted: activities.filter(a => a.activityType === SalesActivityType.LEAD_CONVERTED).length,
      customersCreated: activities.filter(a => a.activityType === SalesActivityType.CUSTOMER_CREATED).length,
      bookingsCreated: activities.filter(a => a.activityType === SalesActivityType.BOOKING_CREATED).length,
      callsMade: activities.filter(a => a.activityType === SalesActivityType.CALL_MADE).length,
      emailsSent: activities.filter(a => a.activityType === SalesActivityType.EMAIL_SENT).length,
      meetingsHeld: activities.filter(a => a.activityType === SalesActivityType.MEETING_SCHEDULED).length,
      totalPotentialValue: activities.reduce((sum, a) => sum + (a.potentialValue || 0), 0),
      averageActivityDuration: this.calculateAverageDuration(activities),
      successRate: this.calculateSuccessRate(activities),
    };

    return stats;
  }

  async getTeamActivityStats(
    teamUserIds: string[],
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ [userId: string]: SalesActivityStats }> {
    const teamStats: { [userId: string]: SalesActivityStats } = {};

    for (const userId of teamUserIds) {
      teamStats[userId] = await this.getUserActivityStats(userId, startDate, endDate);
    }

    return teamStats;
  }

  async getTopPerformers(
    teamUserIds: string[],
    startDate?: Date,
    endDate?: Date,
    metric: 'leadsConverted' | 'totalPotentialValue' | 'totalActivities' = 'leadsConverted',
  ): Promise<Array<{ userId: string; value: number; stats: SalesActivityStats }>> {
    const teamStats = await this.getTeamActivityStats(teamUserIds, startDate, endDate);
    
    const performers = Object.entries(teamStats).map(([userId, stats]) => ({
      userId,
      value: stats[metric],
      stats,
    }));

    return performers.sort((a, b) => b.value - a.value);
  }

  private calculateAverageDuration(activities: SalesActivity[]): number {
    const activitiesWithDuration = activities.filter(a => a.duration && a.duration > 0);
    if (activitiesWithDuration.length === 0) return 0;
    
    const totalDuration = activitiesWithDuration.reduce((sum, a) => sum + a.duration, 0);
    return totalDuration / activitiesWithDuration.length;
  }

  private calculateSuccessRate(activities: SalesActivity[]): number {
    if (activities.length === 0) return 0;
    
    const successfulActivities = activities.filter(a => a.isSuccessful).length;
    return (successfulActivities / activities.length) * 100;
  }

  async getActivityTrends(
    userId: string,
    days: number = 30,
  ): Promise<Array<{ date: string; count: number; potentialValue: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const activities = await this.salesActivityRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    // Group activities by date
    const trends: { [date: string]: { count: number; potentialValue: number } } = {};
    
    activities.forEach(activity => {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { count: 0, potentialValue: 0 };
      }
      trends[date].count++;
      trends[date].potentialValue += activity.potentialValue || 0;
    });

    return Object.entries(trends).map(([date, data]) => ({
      date,
      count: data.count,
      potentialValue: data.potentialValue,
    }));
  }
}
