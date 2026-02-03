import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { Customer } from '../customers/customer.entity';
import { Plot, PlotStatus } from '../plots/plot.entity';
import { User } from '../users/user.entity';
import { PaymentScheduleService } from '../finance/payment-schedule.service';
import { EnhancedPaymentScheduleService } from '../finance/enhanced-payment-schedule.service';
import { PaymentPlanService } from '../finance/payment-plan.service';
import { PaymentType } from '../finance/payment-schedule.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../finance/payment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingsController {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private dataSource: DataSource,
    private paymentScheduleService: PaymentScheduleService,
    private enhancedPaymentScheduleService: EnhancedPaymentScheduleService,
    private paymentPlanService: PaymentPlanService,
  ) {}

  @Get()
  @RequirePermissions(Permission.VIEW_BOOKINGS)
  async getAllBookings(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const queryBuilder = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.plot', 'plot');

    // Apply role-based filtering
    if (req.user.role === 'sales_person') {
      console.log('Sales person filtering: showing only bookings created by them');
      queryBuilder.andWhere('booking.createdById = :userId', { userId: req.user.userId });
    }
    // Sales managers and admins can see all bookings (no additional filtering)

    if (search) {
      queryBuilder.andWhere(
        '(booking.bookingNumber LIKE :search OR customer.fullName LIKE :search OR plot.plotNumber LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;
    
    const [bookings, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Add additional data for dashboard
    const bookingsWithStats = await Promise.all(
      bookings.map(async (booking) => {
        const installmentsCount = await this.getBookingInstallmentsCount(booking.id);
        const paidInstallments = await this.getBookingPaidInstallmentsCount(booking.id);
        const nextPayment = await this.getNextPayment(booking.id);
        
        return {
          id: booking.id,
          bookingNumber: this.generateBookingNumber(booking.id),
          customerId: booking.customerId,
          customerName: booking.customer?.fullName || 'Unknown',
          plotId: booking.plotId,
          plotNumber: booking.plot?.plotNumber || 'Unknown',
          downPayment: booking.downPayment,
          totalAmount: booking.totalAmount,
          status: booking.status,
          bookingDate: booking.bookingDate,
          createdAt: booking.createdAt,
          installmentsCount,
          paidInstallments,
          nextPaymentDate: nextPayment?.dueDate,
          nextPaymentAmount: nextPayment?.amount,
        };
      })
    );

    return {
      data: bookingsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_BOOKINGS)
  async getBookingById(@Request() req, @Param('id') id: string) {
    const queryBuilder = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.plot', 'plot')
      .leftJoinAndSelect('booking.installments', 'installments')
      .where('booking.id = :id', { id });

    // Apply role-based filtering
    if (req.user.role === 'sales_person') {
      console.log('Sales person filtering: checking if booking was created by them');
      queryBuilder.andWhere('booking.createdById = :userId', { userId: req.user.userId });
    }

    const booking = await queryBuilder.getOne();

    if (!booking) {
      return { error: 'Booking not found' };
    }

    return {
      ...booking,
      bookingNumber: this.generateBookingNumber(booking.id),
    };
  }

  @Post()
  async createBooking(@Body() createBookingDto: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:144',message:'createBooking entry',data:{createBookingDto,downPayment:createBookingDto.downPayment,paidAmount:createBookingDto.paidAmount,totalAmount:createBookingDto.totalAmount,paymentType:createBookingDto.paymentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('=== BOOKING CREATION REQUEST ===');
    console.log('Request body:', createBookingDto);
    
    // Validate customer and plot exist
    const customer = await this.customerRepository.findOne({
      where: { id: createBookingDto.customerId }
    });
    
    const plot = await this.plotRepository.findOne({
      where: { id: createBookingDto.plotId }
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:157',message:'After customer/plot lookup',data:{customerFound:!!customer,plotFound:!!plot,plotStatus:plot?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log('Customer found:', customer ? 'Yes' : 'No', customer?.id);
    console.log('Plot found:', plot ? 'Yes' : 'No', plot?.id, plot?.status);

    if (!customer) {
      console.log('ERROR: Customer not found');
      return { error: 'Customer not found' };
    }

    if (!plot) {
      console.log('ERROR: Plot not found');
      return { error: 'Plot not found' };
    }

    if (plot.status !== 'available') {
      console.log('ERROR: Plot is not available, status:', plot.status);
      return { error: 'Plot is not available' };
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:175',message:'Before booking creation',data:{downPayment:createBookingDto.downPayment,paidAmount:createBookingDto.paidAmount,paymentType:createBookingDto.paymentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const booking = this.bookingRepository.create({
        ...createBookingDto,
        bookingNumber: this.generateBookingNumber(),
        bookingDate: new Date(),
        paidAmount: createBookingDto.paidAmount || 0,
        pendingAmount: createBookingDto.totalAmount - (createBookingDto.paidAmount || 0),
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:184',message:'Booking object created',data:{booking:JSON.stringify(booking)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('Booking object created:', booking);

      const savedBooking = await this.bookingRepository.save(booking) as unknown as Booking;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:187',message:'Booking saved',data:{bookingId:savedBooking.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('Booking saved successfully:', savedBooking.id);

      // Update plot status to reserved
      await this.plotRepository.update(plot.id, { status: PlotStatus.RESERVED });
      console.log('Plot status updated to reserved');

      // Create payment schedule
      const paymentType = createBookingDto.paymentType || PaymentType.INSTALLMENT;
      
      console.log('Creating payment schedule with:', {
        paymentType,
        totalAmount: createBookingDto.totalAmount,
        downPayment: createBookingDto.downPayment,
        paymentPlanId: createBookingDto.paymentPlanId
      });
      
      let paymentSchedule;
      
      if (createBookingDto.paymentPlanId && paymentType === PaymentType.INSTALLMENT) {
        // Use payment plan to create detailed installment schedule
        console.log('Using payment plan for installment schedule');
        const paymentPlan = await this.paymentPlanService.findOne(createBookingDto.paymentPlanId);
        if (!paymentPlan) {
          throw new Error('Payment plan not found');
        }
        
        paymentSchedule = await this.enhancedPaymentScheduleService.createPaymentScheduleFromPlan(
          savedBooking,
          paymentPlan,
          createBookingDto.paidAmount || 0, // Actual down payment made
        );
      } else {
        // Use basic payment schedule (for full payment or custom installments)
        const installmentCount = createBookingDto.installmentCount || 24;
        paymentSchedule = await this.paymentScheduleService.createPaymentSchedule(
          savedBooking,
          paymentType,
          createBookingDto.totalAmount,
          createBookingDto.downPayment,
          paymentType === PaymentType.INSTALLMENT ? installmentCount : undefined,
        );
      }
      console.log('Payment schedule created successfully');

      // Create initial payment record if there's a paid amount
      if (createBookingDto.paidAmount && createBookingDto.paidAmount > 0) {
        console.log('Creating initial payment record for amount:', createBookingDto.paidAmount);
        
        // Get the payment schedule that was just created
        const paymentSchedule = await this.paymentScheduleService.findByBookingId(savedBooking.id);
        
        const initialPayment = this.paymentRepository.create({
          paymentScheduleId: paymentSchedule?.id,
          amount: createBookingDto.paidAmount,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.CASH, // Default to cash, can be updated later
          status: PaymentStatus.COMPLETED,
          transactionId: `BOOKING-${savedBooking.id}-INITIAL`,
          notes: 'Initial payment made at booking time - automatically recorded',
        });

        await this.paymentRepository.save(initialPayment);
        console.log('Initial payment record created successfully');
      }

      const result = {
        ...savedBooking,
        bookingNumber: this.generateBookingNumber(),
      };
      
      console.log('=== BOOKING CREATION SUCCESS ===');
      console.log('Final result:', result);
      
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c7c25835-cb2a-4279-8c31-ce35bd5734cb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bookings.controller.ts:261',message:'Booking creation error',data:{errorMessage:error.message,errorStack:error.stack,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('=== BOOKING CREATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  @Put(':id')
  async updateBooking(@Param('id') id: string, @Body() updateBookingDto: any) {
    await this.bookingRepository.update(id, updateBookingDto);
    const booking = await this.bookingRepository.findOne({ where: { id } });
    
    return {
      ...booking,
      bookingNumber: this.generateBookingNumber(booking.id),
    };
  }

  @Delete(':id')
  async deleteBooking(@Param('id') id: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (booking) {
      // Update plot status back to available
      await this.plotRepository.update(booking.plotId, { status: PlotStatus.AVAILABLE });
    }
    
    await this.bookingRepository.delete(id);
    return { message: 'Booking deleted successfully' };
  }

  @Put(':id/status')
  async updateBookingStatus(@Param('id') id: string, @Body() body: { status: BookingStatus }) {
    await this.bookingRepository.update(id, { status: body.status });
    const booking = await this.bookingRepository.findOne({ where: { id } });
    
    return {
      ...booking,
      bookingNumber: this.generateBookingNumber(booking.id),
    };
  }

  @Get(':id/payment-schedule')
  async getBookingPaymentSchedule(@Param('id') id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['paymentSchedules', 'paymentSchedules.installments', 'paymentSchedules.payments', 'paymentSchedules.paymentPlan'],
    });

    if (!booking) {
      return { error: 'Booking not found' };
    }

    const paymentSchedule = booking.paymentSchedules[0]; // Assuming one schedule per booking
    if (!paymentSchedule) {
      return { error: 'Payment schedule not found' };
    }

    // Sort installments by due date
    if (paymentSchedule.installments) {
      paymentSchedule.installments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    return {
      booking: {
        id: booking.id,
        bookingNumber: this.generateBookingNumber(booking.id),
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        pendingAmount: booking.pendingAmount,
      },
      paymentSchedule,
    };
  }

  private generateBookingNumber(id?: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BK-${timestamp}-${random}`;
  }

  private async getBookingInstallmentsCount(bookingId: string): Promise<number> {
    const { Installment } = await import('../finance/installment.entity');
    const installmentRepo = this.dataSource.getRepository(Installment);
    return await installmentRepo.count({ where: { bookingId } });
  }

  private async getBookingPaidInstallmentsCount(bookingId: string): Promise<number> {
    const { Installment, InstallmentStatus } = await import('../finance/installment.entity');
    const installmentRepo = this.dataSource.getRepository(Installment);
    return await installmentRepo.count({ 
      where: { 
        bookingId,
        status: InstallmentStatus.PAID,
      } 
    });
  }

  private async getNextPayment(bookingId: string): Promise<{ dueDate: Date; amount: number } | null> {
    const { Installment, InstallmentStatus } = await import('../finance/installment.entity');
    const installmentRepo = this.dataSource.getRepository(Installment);
    const nextInstallment = await installmentRepo.findOne({
      where: {
        bookingId,
        status: InstallmentStatus.PENDING,
      },
      order: { dueDate: 'ASC' },
    });

    if (nextInstallment) {
      return {
        dueDate: nextInstallment.dueDate,
        amount: nextInstallment.amount,
      };
    }
    return null;
  }
} 