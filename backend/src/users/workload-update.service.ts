import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';

@Injectable()
export class WorkloadUpdateService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  /**
   * Update workload score for a specific sales agent
   */
  async updateAgentWorkload(agentId: string): Promise<void> {
    try {
      // Count active leads assigned to this agent
      // Exclude converted, lost, and not_interested leads from workload calculation
      const leadCount = await this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: Not(In([LeadStatus.CLOSE_WON, LeadStatus.NOT_INTERESTED]))
        }
      });

      // Workload score is just the count of active leads
      const workloadScore = leadCount;

      // Update the agent's workload score
      await this.userRepository.update(agentId, {
        workloadScore,
        updatedAt: new Date()
      });

      console.log(`✅ Updated workload for agent ${agentId}: ${leadCount} leads → Score: ${workloadScore}`);
    } catch (error) {
      console.error(`❌ Error updating workload for agent ${agentId}:`, error.message);
    }
  }

  /**
   * Update workload scores for all sales agents
   */
  async updateAllAgentWorkloads(): Promise<void> {
    try {
      // Get all active sales agents
      const salesAgents = await this.userRepository.find({
        where: { 
          role: UserRole.SALES_PERSON,
          isActive: true 
        },
        select: ['id', 'fullName']
      });

      console.log(`🔄 Updating workload scores for ${salesAgents.length} sales agents...`);

      // Update workload for each agent
      await Promise.all(
        salesAgents.map(agent => this.updateAgentWorkload(agent.id))
      );

      console.log('✅ All workload scores updated successfully');
    } catch (error) {
      console.error('❌ Error updating all workload scores:', error.message);
    }
  }

  /**
   * Update workload scores when a lead is assigned or reassigned
   */
  async handleLeadAssignment(leadId: string, oldAgentId?: string, newAgentId?: string): Promise<void> {
    try {
      // Update workload for both old and new agents if they exist
      const updates = [];
      
      if (oldAgentId) {
        updates.push(this.updateAgentWorkload(oldAgentId));
      }
      
      if (newAgentId) {
        updates.push(this.updateAgentWorkload(newAgentId));
      }

      await Promise.all(updates);
    } catch (error) {
      console.error('❌ Error handling lead assignment workload update:', error.message);
    }
  }

  /**
   * Update workload scores when lead status changes
   */
  async handleLeadStatusChange(leadId: string, agentId: string): Promise<void> {
    try {
      // Only update if the agent exists
      if (agentId) {
        await this.updateAgentWorkload(agentId);
      }
    } catch (error) {
      console.error('❌ Error handling lead status change workload update:', error.message);
    }
  }
}
