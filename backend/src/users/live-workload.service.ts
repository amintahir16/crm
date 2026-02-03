import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  workloadScore: number;
  activeLeads: number;
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  notInterestedLeads: number;
}

@Injectable()
export class LiveWorkloadService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  /**
   * Get live workload score for a specific sales agent
   */
  async getAgentWorkload(agentId: string): Promise<AgentWorkload> {
    // Get agent info
    const agent = await this.userRepository.findOne({
      where: { id: agentId },
      select: ['id', 'fullName']
    });

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Count different types of leads
    const [
      activeLeads,
      totalLeads,
      convertedLeads,
      lostLeads,
      notInterestedLeads
    ] = await Promise.all([
      // Active leads (exclude converted, lost, not_interested)
      this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: Not(In([LeadStatus.CLOSE_WON, LeadStatus.NOT_INTERESTED]))
        }
      }),
      // Total leads
      this.leadRepository.count({
        where: { assignedToUserId: agentId }
      }),
      // Converted leads
      this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: LeadStatus.CLOSE_WON
        }
      }),
      // Lost leads
      this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: LeadStatus.NOT_INTERESTED
        }
      }),
      // Not interested leads
      this.leadRepository.count({
        where: { 
          assignedToUserId: agentId,
          status: LeadStatus.NOT_INTERESTED
        }
      })
    ]);

    // Workload score is just the count of active leads
    const workloadScore = activeLeads;

    return {
      agentId: agent.id,
      agentName: agent.fullName,
      workloadScore,
      activeLeads,
      totalLeads,
      convertedLeads,
      lostLeads,
      notInterestedLeads
    };
  }

  /**
   * Get live workload scores for all sales agents
   */
  async getAllAgentWorkloads(): Promise<AgentWorkload[]> {
    // Get all active sales agents
    const salesAgents = await this.userRepository.find({
      where: { 
        role: UserRole.SALES_PERSON,
        isActive: true 
      },
      select: ['id', 'fullName']
    });

    // Get workload for each agent
    const workloads = await Promise.all(
      salesAgents.map(agent => this.getAgentWorkload(agent.id))
    );

    // Sort by workload score (highest first)
    return workloads.sort((a, b) => b.workloadScore - a.workloadScore);
  }

  /**
   * Get team workload summary
   */
  async getTeamWorkloadSummary(): Promise<{
    totalMembers: number;
    activeMembers: number;
    averageWorkload: number;
    totalActiveLeads: number;
    totalConvertedLeads: number;
    totalLostLeads: number;
    totalNotInterestedLeads: number;
    members: AgentWorkload[];
  }> {
    const workloads = await this.getAllAgentWorkloads();
    
    const totalMembers = workloads.length;
    const activeMembers = workloads.filter(w => w.activeLeads > 0).length;
    const averageWorkload = totalMembers > 0 
      ? workloads.reduce((sum, w) => sum + w.workloadScore, 0) / totalMembers 
      : 0;
    
    const totalActiveLeads = workloads.reduce((sum, w) => sum + w.activeLeads, 0);
    const totalConvertedLeads = workloads.reduce((sum, w) => sum + w.convertedLeads, 0);
    const totalLostLeads = workloads.reduce((sum, w) => sum + w.lostLeads, 0);
    const totalNotInterestedLeads = workloads.reduce((sum, w) => sum + w.notInterestedLeads, 0);

    return {
      totalMembers,
      activeMembers,
      averageWorkload: Math.round(averageWorkload * 10) / 10,
      totalActiveLeads,
      totalConvertedLeads,
      totalLostLeads,
      totalNotInterestedLeads,
      members: workloads
    };
  }

  /**
   * Get next available agent for lead assignment (lowest workload)
   */
  async getNextAvailableAgent(): Promise<string | null> {
    const workloads = await this.getAllAgentWorkloads();
    
    if (workloads.length === 0) {
      return null;
    }

    // Sort by workload score (lowest first) and return the first agent's ID
    const sortedByWorkload = workloads.sort((a, b) => a.workloadScore - b.workloadScore);
    return sortedByWorkload[0].agentId;
  }
}
