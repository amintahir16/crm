import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerInteractionService } from './customer-interaction.service';
import { CustomerInteraction, InteractionType, InteractionStatus } from './customer-interaction.entity';

@Controller('customer-interactions')
@UseGuards(JwtAuthGuard)
export class CustomerInteractionController {
  constructor(private readonly interactionService: CustomerInteractionService) {}

  @Post()
  async createInteraction(@Body() interactionData: Partial<CustomerInteraction>) {
    return await this.interactionService.createInteraction(interactionData);
  }

  @Get('customer/:customerId')
  async getCustomerInteractions(
    @Param('customerId') customerId: string,
    @Query('type') type?: InteractionType,
    @Query('status') status?: InteractionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    return await this.interactionService.getCustomerInteractions(customerId, filters);
  }

  @Put(':id')
  async updateInteraction(
    @Param('id') id: string,
    @Body() updateData: Partial<CustomerInteraction>,
  ) {
    return await this.interactionService.updateInteraction(id, updateData);
  }

  @Put(':id/complete')
  async completeInteraction(
    @Param('id') id: string,
    @Body() completionData: {
      outcome: string;
      nextSteps?: string;
      nextFollowUpDate?: string;
    },
  ) {
    return await this.interactionService.completeInteraction(
      id,
      completionData.outcome,
      completionData.nextSteps,
      completionData.nextFollowUpDate ? new Date(completionData.nextFollowUpDate) : undefined,
    );
  }

  @Get('upcoming')
  async getUpcomingInteractions(
    @Query('userId') userId?: string,
    @Query('days') days?: string,
  ) {
    return await this.interactionService.getUpcomingInteractions(
      userId,
      days ? parseInt(days) : 7,
    );
  }

  @Get('overdue-follow-ups')
  async getOverdueFollowUps() {
    return await this.interactionService.getOverdueFollowUps();
  }

  @Get('stats')
  async getInteractionStats(
    @Query('customerId') customerId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.interactionService.getInteractionStats(
      customerId,
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Delete(':id')
  async deleteInteraction(@Param('id') id: string) {
    await this.interactionService.deleteInteraction(id);
    return { message: 'Interaction deleted successfully' };
  }
}
