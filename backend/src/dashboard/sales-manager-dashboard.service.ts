import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';
import { Customer } from '../customers/customer.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { Payment, PaymentStatus } from '../finance/payment.entity';
import { LeadActivityLog } from '../leads/lead-activity-log.entity';

@Injectable()
export class SalesManagerDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(LeadActivityLog)
    private leadActivityLogRepository: Repository<LeadActivityLog>,
  ) {}

  /**
   * Get comprehensive dashboard data for sales manager
   */
  async getSalesManagerDashboard(managerId: string) {
    console.log('Sales Manager Dashboard - Manager ID:', managerId);
    
    const [
      teamStats,
      leadStats,
      customerStats,
      bookingStats,
      paymentStats,
      recentActivities,
      teamPerformance
    ] = await Promise.all([
      this.getTeamStats(managerId),
      this.getLeadStats(managerId),
      this.getCustomerStats(managerId),
      this.getBookingStats(managerId),
      this.getPaymentStats(managerId),
      this.getRecentActivities(managerId),
      this.getTeamPerformance(managerId)
    ]);

    console.log('Sales Manager Dashboard - Team Stats:', teamStats);
    console.log('Sales Manager Dashboard - Lead Stats:', leadStats);

    return {
      teamStats,
      leadStats,
      customerStats,
      bookingStats,
      paymentStats,
      recentActivities,
      teamPerformance,
      lastUpdated: new Date()
    };
  }

  /**
   * Get team statistics
   */
  private async getTeamStats(managerId: string) {
    console.log('Getting team stats for manager:', managerId);
    
    const totalMembers = await this.userRepository.count({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      }
    });
    
    console.log('Total members found:', totalMembers);

    const activeMembers = await this.userRepository.count({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      }
    });

    const averageWorkload = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.workloadScore)', 'avgWorkload')
      .where('user.assignedToUserId = :managerId', { managerId })
      .andWhere('user.role = :role', { role: UserRole.SALES_PERSON })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      totalMembers,
      activeMembers,
      averageWorkload: parseFloat(averageWorkload.avgWorkload) || 0
    };
  }

  /**
   * Get lead statistics
   */
  private async getLeadStats(managerId: string) {
    // Get team member IDs
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        leadsBySource: {},
        leadsByPriority: {}
      };
    }

    const totalLeads = await this.leadRepository.count({
      where: { assignedToUserId: In(teamMemberIds) }
    });

    const newLeads = await this.leadRepository.count({
      where: { 
        assignedToUserId: In(teamMemberIds),
        status: LeadStatus.NEW
      }
    });

    const qualifiedLeads = await this.leadRepository.count({
      where: { 
        assignedToUserId: In(teamMemberIds),
        status: LeadStatus.INTERESTED
      }
    });

    const convertedLeads = await this.leadRepository.count({
      where: { 
        assignedToUserId: In(teamMemberIds),
        status: LeadStatus.CLOSE_WON
      }
    });

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Get leads by source
    const leadsBySource = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('lead.assignedToUserId IN (:...teamMemberIds)', { teamMemberIds })
      .groupBy('lead.source')
      .getRawMany();

    // Get leads by priority
    const leadsByPriority = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('lead.assignedToUserId IN (:...teamMemberIds)', { teamMemberIds })
      .groupBy('lead.priority')
      .getRawMany();

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate,
      leadsBySource: leadsBySource.reduce((acc, item) => {
        acc[item.source] = parseInt(item.count);
        return acc;
      }, {}),
      leadsByPriority: leadsByPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  /**
   * Get customer statistics
   */
  private async getCustomerStats(managerId: string) {
    // Get team member IDs
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0
      };
    }

    // Get customers converted from leads assigned to team members
    const totalCustomers = await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('leads', 'lead', 'lead.convertedToCustomerId = customer.id')
      .where('lead.assignedToUserId IN (:...teamMemberIds)', { teamMemberIds })
      .getCount();

    const newCustomers = await this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin('leads', 'lead', 'lead.convertedToCustomerId = customer.id')
      .where('lead.assignedToUserId IN (:...teamMemberIds)', { teamMemberIds })
      .andWhere('customer.createdAt >= :thirtyDaysAgo', { 
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      })
      .getCount();

    return {
      totalCustomers,
      newCustomers,
      activeCustomers: totalCustomers // Simplified - could be more complex
    };
  }

  /**
   * Get booking statistics
   */
  private async getBookingStats(managerId: string) {
    // Get team member IDs
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        totalValue: 0
      };
    }

    const totalBookings = await this.bookingRepository.count({
      where: { createdById: In(teamMemberIds) }
    });

    const confirmedBookings = await this.bookingRepository.count({
      where: { 
        createdById: In(teamMemberIds),
        status: BookingStatus.CONFIRMED
      }
    });

    const pendingBookings = await this.bookingRepository.count({
      where: { 
        createdById: In(teamMemberIds),
        status: BookingStatus.PENDING
      }
    });

    const totalValue = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalAmount)', 'total')
      .where('booking.createdById IN (:...teamMemberIds)', { teamMemberIds })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .getRawOne();

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalValue: parseFloat(totalValue.total) || 0
    };
  }

  /**
   * Get payment statistics
   */
  private async getPaymentStats(managerId: string) {
    // Get team member IDs
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id']
    });

    const teamMemberIds = teamMembers.map(member => member.id);

    if (teamMemberIds.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        pendingPayments: 0,
        approvedPayments: 0
      };
    }

    const totalPayments = await this.paymentRepository.count({
      where: { processedBy: In(teamMemberIds) }
    });

    const totalAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.processedBy IN (:...teamMemberIds)', { teamMemberIds })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    const pendingPayments = await this.paymentRepository.count({
      where: { 
        processedBy: In(teamMemberIds),
        status: PaymentStatus.PENDING
      }
    });

    const approvedPayments = await this.paymentRepository.count({
      where: { 
        processedBy: In(teamMemberIds),
        status: PaymentStatus.COMPLETED
      }
    });

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount.total) || 0,
      pendingPayments,
      approvedPayments
    };
  }

  /**
   * Get recent activities across team
   */
  private async getRecentActivities(managerId: string) {
    // Get team member IDs
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

    const recentActivities = await this.leadActivityLogRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.lead', 'lead')
      .where('activity.userId IN (:...teamMemberIds)', { teamMemberIds })
      .orderBy('activity.createdAt', 'DESC')
      .take(20)
      .getMany();

    return recentActivities.map(activity => {
      const leadName = activity.lead?.fullName || activity.lead?.leadId || 'Unknown Lead';
      const userName = activity.user?.fullName || 'Unknown User';
      
      // Format description based on activity type
      let formattedDescription = activity.description;
      if (activity.metadata) {
        try {
          const metadata = JSON.parse(activity.metadata);
          
          switch (activity.activityType) {
            case 'communication_added':
              formattedDescription = `${userName} communicated with ${leadName} - ${metadata.communicationType || 'Communication'}`;
              if (metadata.outcome) {
                formattedDescription += ` (Outcome: ${metadata.outcome})`;
              }
              break;
            case 'note_added':
              formattedDescription = `${userName} added a note for ${leadName}: "${metadata.noteTitle || 'Note'}"`;
              break;
            case 'status_changed':
              formattedDescription = `${userName} changed status for ${leadName} from "${metadata.oldStatus || 'Unknown'}" to "${metadata.newStatus || 'Unknown'}"`;
              break;
            case 'assigned':
            case 'reassigned':
              formattedDescription = `${userName} ${activity.activityType === 'assigned' ? 'assigned' : 'reassigned'} ${leadName}`;
              break;
            case 'created':
              formattedDescription = `${userName} created lead: ${leadName}`;
              break;
            case 'converted':
              formattedDescription = `${userName} converted ${leadName} to customer`;
              break;
            default:
              formattedDescription = `${userName}: ${activity.description}`;
          }
        } catch (e) {
          // If metadata parsing fails, use default description
          formattedDescription = `${userName}: ${activity.description}`;
        }
      } else {
        formattedDescription = `${userName}: ${activity.description}`;
      }

      return {
        id: activity.id,
        type: activity.activityType,
        description: formattedDescription,
        userName: userName,
        leadName: leadName,
        leadId: activity.leadId,
        createdAt: activity.createdAt,
        timestamp: activity.createdAt,
      };
    });
  }

  /**
   * Get team performance metrics
   */
  private async getTeamPerformance(managerId: string) {
    const teamMembers = await this.userRepository.find({
      where: { 
        assignedToUserId: managerId,
        role: UserRole.SALES_PERSON,
        isActive: true
      },
      select: ['id', 'fullName', 'workloadScore']
    });

    const performance = await Promise.all(
      teamMembers.map(async (member) => {
        const leadsCount = await this.leadRepository.count({
          where: { assignedToUserId: member.id }
        });

        const convertedLeads = await this.leadRepository.count({
          where: { 
            assignedToUserId: member.id,
            status: LeadStatus.CLOSE_WON
          }
        });

        const bookingsCount = await this.bookingRepository.count({
          where: { createdById: member.id }
        });

        const totalSales = await this.bookingRepository
          .createQueryBuilder('booking')
          .select('SUM(booking.totalAmount)', 'total')
          .where('booking.createdById = :memberId', { memberId: member.id })
          .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
          .getRawOne();

        return {
          memberId: member.id,
          memberName: member.fullName,
          workloadScore: member.workloadScore,
          leadsCount,
          convertedLeads,
          conversionRate: leadsCount > 0 ? (convertedLeads / leadsCount) * 100 : 0,
          bookingsCount,
          totalSales: parseFloat(totalSales.total) || 0
        };
      })
    );

    return performance;
  }
}
