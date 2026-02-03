import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerInteraction, InteractionType, InteractionStatus } from './customer-interaction.entity';

@Injectable()
export class CustomerInteractionService {
  constructor(
    @InjectRepository(CustomerInteraction)
    private interactionRepository: Repository<CustomerInteraction>,
  ) {}

  async createInteraction(interactionData: Partial<CustomerInteraction>): Promise<CustomerInteraction> {
    const interaction = this.interactionRepository.create(interactionData);
    return await this.interactionRepository.save(interaction);
  }

  async getCustomerInteractions(
    customerId: string,
    filters: {
      type?: InteractionType;
      status?: InteractionStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const queryBuilder = this.interactionRepository.createQueryBuilder('interaction')
      .where('interaction.customerId = :customerId', { customerId })
      .leftJoinAndSelect('interaction.user', 'user')
      .orderBy('interaction.createdAt', 'DESC');

    if (filters.type) {
      queryBuilder.andWhere('interaction.type = :type', { type: filters.type });
    }

    if (filters.status) {
      queryBuilder.andWhere('interaction.status = :status', { status: filters.status });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('interaction.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('interaction.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [interactions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: interactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateInteraction(
    id: string,
    updateData: Partial<CustomerInteraction>,
  ): Promise<CustomerInteraction> {
    await this.interactionRepository.update(id, updateData);
    return await this.interactionRepository.findOne({ where: { id } });
  }

  async completeInteraction(
    id: string,
    outcome: string,
    nextSteps?: string,
    nextFollowUpDate?: Date,
  ): Promise<CustomerInteraction> {
    const updateData: Partial<CustomerInteraction> = {
      status: InteractionStatus.COMPLETED,
      completedDate: new Date(),
      outcome,
      nextSteps,
      nextFollowUpDate,
    };

    return await this.updateInteraction(id, updateData);
  }

  async getUpcomingInteractions(
    userId?: string,
    days: number = 7,
  ): Promise<CustomerInteraction[]> {
    const queryBuilder = this.interactionRepository.createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.customer', 'customer')
      .leftJoinAndSelect('interaction.user', 'user')
      .where('interaction.status = :status', { status: InteractionStatus.SCHEDULED })
      .andWhere('interaction.scheduledDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      })
      .orderBy('interaction.scheduledDate', 'ASC');

    if (userId) {
      queryBuilder.andWhere('interaction.userId = :userId', { userId });
    }

    return await queryBuilder.getMany();
  }

  async getOverdueFollowUps(): Promise<CustomerInteraction[]> {
    return await this.interactionRepository.createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.customer', 'customer')
      .leftJoinAndSelect('interaction.user', 'user')
      .where('interaction.requiresFollowUp = :requiresFollowUp', { requiresFollowUp: true })
      .andWhere('interaction.nextFollowUpDate < :currentDate', { currentDate: new Date() })
      .andWhere('interaction.status = :status', { status: InteractionStatus.COMPLETED })
      .orderBy('interaction.nextFollowUpDate', 'ASC')
      .getMany();
  }

  async getInteractionStats(
    customerId?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.interactionRepository.createQueryBuilder('interaction');

    if (customerId) {
      queryBuilder.andWhere('interaction.customerId = :customerId', { customerId });
    }

    if (userId) {
      queryBuilder.andWhere('interaction.userId = :userId', { userId });
    }

    if (startDate) {
      queryBuilder.andWhere('interaction.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('interaction.createdAt <= :endDate', { endDate });
    }

    // Get interaction type counts
    const typeCounts = await queryBuilder
      .select('interaction.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('interaction.type')
      .getRawMany();

    // Get status counts
    const statusCounts = await queryBuilder
      .select('interaction.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('interaction.status')
      .getRawMany();

    // Get monthly activity
    const monthlyActivity = await queryBuilder
      .select('DATE_FORMAT(interaction.createdAt, "%Y-%m")', 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE_FORMAT(interaction.createdAt, "%Y-%m")')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      typeCounts,
      statusCounts,
      monthlyActivity,
    };
  }

  async deleteInteraction(id: string): Promise<void> {
    await this.interactionRepository.delete(id);
  }
}
