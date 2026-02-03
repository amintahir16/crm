import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Lead } from '../leads/lead.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  @Get()
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  async getAllCustomers(
    @Request() req,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('Fetching all customers');
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Apply role-based filtering
    if (req.user.role === 'sales_person') {
      console.log('Sales person filtering: showing only customers from converted leads');
      // Sales agents can only see customers converted from their leads
      queryBuilder
        .leftJoin('customer.convertedFromLeads', 'lead')
        .andWhere('lead.assignedToUserId = :userId', { userId: req.user.userId });
    }
    // Sales managers and admins can see all customers (no additional filtering)

    if (search) {
      queryBuilder.andWhere(
        '(customer.fullName LIKE :search OR customer.cnic LIKE :search OR customer.phone LIKE :search OR customer.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;
    
    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Add additional data for dashboard
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const bookingsCount = await this.getCustomerBookingsCount(customer.id);
        const totalInvested = await this.getCustomerTotalInvested(customer.id);
        
        return {
          ...customer,
          bookingsCount,
          totalInvested,
        };
      })
    );

    const result = {
      data: customersWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
    
    console.log('Returning customers:', result.data.length, 'customers found');
    return result;
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  async getCustomerById(@Request() req, @Param('id') id: string) {
    console.log('Fetching customer with ID:', id);
    
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .where('customer.id = :id', { id });

    // Apply role-based filtering
    if (req.user.role === 'sales_person') {
      console.log('Sales person filtering: checking if customer is from their converted leads');
      queryBuilder
        .leftJoin('customer.convertedFromLeads', 'lead')
        .andWhere('lead.assignedToUserId = :userId', { userId: req.user.userId });
    }
    
    const customer = await queryBuilder.getOne();
    console.log('Customer found:', customer);
    
    if (!customer) {
      console.log('Customer not found for ID:', id);
      return { error: 'Customer not found' };
    }

    const bookingsCount = await this.getCustomerBookingsCount(id);
    const totalInvested = await this.getCustomerTotalInvested(id);

    const result = {
      ...customer,
      bookingsCount,
      totalInvested,
    };
    
    console.log('Returning customer data:', result);
    return result;
  }

  @Post()
  async createCustomer(@Body() createCustomerDto: any) {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  @Put(':id')
  async updateCustomer(@Param('id') id: string, @Body() updateCustomerDto: any) {
    await this.customerRepository.update(id, updateCustomerDto);
    return await this.customerRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    await this.customerRepository.delete(id);
    return { message: 'Customer deleted successfully' };
  }

  @Get(':id/bookings')
  @RequirePermissions(Permission.VIEW_CUSTOMERS)
  async getCustomerBookings(@Request() req, @Param('id') id: string) {
    try {
      const queryBuilder = this.customerRepository.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.bookings', 'booking')
        .leftJoinAndSelect('booking.plot', 'plot')
        .leftJoinAndSelect('booking.paymentSchedules', 'paymentSchedule')
        .leftJoinAndSelect('booking.createdBy', 'createdBy')
        .where('customer.id = :id', { id });

      // Apply role-based filtering
      if (req.user.role === 'sales_person') {
        console.log('Sales person filtering: checking if customer is from their converted leads');
        queryBuilder
          .leftJoin('customer.convertedFromLeads', 'lead')
          .andWhere('lead.assignedToUserId = :userId', { userId: req.user.userId });
      }

      const customer = await queryBuilder.getOne();

      if (!customer) {
        return { error: 'Customer not found' };
      }

    // Format bookings with additional computed data
    const bookingsWithDetails = customer.bookings.map(booking => {
      const paymentSchedule = booking.paymentSchedules[0]; // Assuming one schedule per booking
      
      return {
        id: booking.id,
        bookingNumber: this.generateBookingNumber(booking.id),
        status: booking.status,
        bookingDate: booking.bookingDate,
        totalAmount: booking.totalAmount,
        downPayment: booking.downPayment,
        paidAmount: booking.paidAmount,
        pendingAmount: booking.pendingAmount,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        plot: {
          id: booking.plot.id,
          plotNumber: booking.plot.plotNumber,
          sizeMarla: booking.plot.sizeMarla,
          sizeSqm: booking.plot.sizeSqm,
          pricePkr: booking.plot.pricePkr,
          phase: booking.plot.phase,
          block: booking.plot.block,
          status: booking.plot.status,
        },
        paymentSchedule: paymentSchedule ? {
          id: paymentSchedule.id,
          paymentType: paymentSchedule.paymentType,
          status: paymentSchedule.status,
          installmentCount: paymentSchedule.installmentCount,
          installmentAmount: paymentSchedule.installmentAmount,
          startDate: paymentSchedule.startDate,
          endDate: paymentSchedule.endDate,
        } : null,
        createdBy: {
          id: booking.createdBy.id,
          fullName: booking.createdBy.fullName,
        },
      };
    });

    return {
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
      bookings: bookingsWithDetails,
      summary: {
        totalBookings: bookingsWithDetails.length,
        totalInvested: bookingsWithDetails.reduce((sum, booking) => sum + booking.totalAmount, 0),
        totalPaid: bookingsWithDetails.reduce((sum, booking) => sum + booking.paidAmount, 0),
        totalPending: bookingsWithDetails.reduce((sum, booking) => sum + booking.pendingAmount, 0),
        activeBookings: bookingsWithDetails.filter(b => b.status === 'confirmed').length,
        completedBookings: bookingsWithDetails.filter(b => b.status === 'completed').length,
      }
    };
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      return { error: 'Failed to fetch customer bookings' };
    }
  }

  private generateBookingNumber(id: string): string {
    // Simple booking number based on ID
    const shortId = id.substring(0, 8).toUpperCase();
    return `BK-${shortId}`;
  }

  private async getCustomerBookingsCount(customerId: string): Promise<number> {
    const bookings = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.bookings', 'booking')
      .where('customer.id = :customerId', { customerId })
      .andWhere('(booking.status IS NULL OR booking.status != :cancelled)', { cancelled: 'cancelled' })
      .getOne();
    
    return bookings?.bookings?.length || 0;
  }

  private async getCustomerTotalInvested(customerId: string): Promise<number> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.bookings', 'booking')
      .leftJoin('booking.paymentSchedules', 'paymentSchedule')
      .select('SUM(paymentSchedule.paidAmount)', 'total')
      .where('customer.id = :customerId', { customerId })
      .getRawOne();
    return parseFloat(result?.total || '0');
  }
} 