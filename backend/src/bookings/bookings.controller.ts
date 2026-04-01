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
import { PaymentType, PaymentSchedule } from '../finance/payment-schedule.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../finance/payment.entity';
import { Installment, InstallmentStatus } from '../finance/installment.entity';
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
    @InjectRepository(Installment)
    private installmentRepository: Repository<Installment>,
    @InjectRepository(PaymentSchedule)
    private paymentScheduleRepository: Repository<PaymentSchedule>,
    private dataSource: DataSource,
    private paymentScheduleService: PaymentScheduleService,
    private enhancedPaymentScheduleService: EnhancedPaymentScheduleService,
    private paymentPlanService: PaymentPlanService,
  ) { }

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
      queryBuilder.andWhere('booking.createdById = :userId', { userId: req.user.userId });
    }

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
      .orderBy('booking.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Self-heal: sync plot statuses with booking statuses (fixes stale data)
    for (const booking of bookings) {
      if (booking.plot) {
        const expectedPlotStatus = 
          booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED
            ? PlotStatus.SOLD
            : booking.status === BookingStatus.PENDING
              ? PlotStatus.RESERVED
              : null;
        
        if (expectedPlotStatus && booking.plot.status !== expectedPlotStatus) {
          await this.plotRepository.update(booking.plot.id, { status: expectedPlotStatus });
          booking.plot.status = expectedPlotStatus;
        }
      }
    }

    // Add additional data for dashboard
    const bookingsWithStats = await Promise.all(
      bookings.map(async (booking) => {
        const installmentsCount = await this.getBookingInstallmentsCount(booking.id);
        const paidInstallments = await this.getBookingPaidInstallmentsCount(booking.id);
        const nextPayment = await this.getNextPayment(booking.id);

        return {
          id: booking.id,
          bookingNumber: booking.bookingNumber || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
          customerId: booking.customerId,
          customerName: booking.customer?.fullName || 'Unknown',
          plotId: booking.plotId,
          plotNumber: booking.plot?.plotNumber || 'Unknown',
          downPayment: booking.downPayment,
          totalAmount: booking.totalAmount,
          paidAmount: booking.paidAmount,
          pendingAmount: booking.pendingAmount,
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
      .leftJoinAndSelect('booking.paymentSchedules', 'paymentSchedules')
      .leftJoinAndSelect('paymentSchedules.paymentPlan', 'paymentPlan')
      .where('booking.id = :id', { id });

    // Apply role-based filtering
    if (req.user.role === 'sales_person') {
      queryBuilder.andWhere('booking.createdById = :userId', { userId: req.user.userId });
    }

    const booking = await queryBuilder.getOne();

    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Compute accurate financial stats from actual payment records
    const completedPayments = await this.getCompletedPayments(booking.id);
    const actualPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const actualPendingAmount = Number(booking.totalAmount) - actualPaidAmount;

    // Sync booking if out of sync
    if (Math.abs(Number(booking.paidAmount) - actualPaidAmount) > 0.01) {
      booking.paidAmount = actualPaidAmount;
      booking.pendingAmount = actualPendingAmount;
      await this.bookingRepository.save(booking);
    }

    // Get installment stats
    const installmentsCount = await this.getBookingInstallmentsCount(booking.id);
    const paidInstallments = await this.getBookingPaidInstallmentsCount(booking.id);
    const nextPayment = await this.getNextPayment(booking.id);

    // Get overdue installments count
    const { Installment: InstallmentEntity, InstallmentStatus: InstStatus } = await import('../finance/installment.entity');
    const installmentRepo = this.dataSource.getRepository(InstallmentEntity);
    const overdueCount = await installmentRepo.count({
      where: { bookingId: booking.id, status: InstStatus.OVERDUE },
    });

    return {
      ...booking,
      bookingNumber: booking.bookingNumber || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
      paidAmount: actualPaidAmount,
      pendingAmount: actualPendingAmount,
      // Computed stats
      installmentsCount,
      paidInstallments,
      overdueInstallments: overdueCount,
      nextPaymentDate: nextPayment?.dueDate || null,
      nextPaymentAmount: nextPayment?.amount || null,
      paymentProgress: Number(booking.totalAmount) > 0 ? Math.min(100, Math.round((actualPaidAmount / Number(booking.totalAmount)) * 100)) : 0,
    };
  }

  @Post()
  async createBooking(@Body() createBookingDto: any) {
    // Validate customer and plot exist
    const customer = await this.customerRepository.findOne({
      where: { id: createBookingDto.customerId }
    });

    const plot = await this.plotRepository.findOne({
      where: { id: createBookingDto.plotId }
    });

    if (!customer) {
      return { error: 'Customer not found' };
    }

    if (!plot) {
      return { error: 'Plot not found' };
    }

    if (plot.status !== 'available') {
      return { error: 'Plot is not available' };
    }

    try {
      // Generate a deterministic, persistent booking number
      const bookingNumber = await this.generateBookingNumber();

      // Handle discount
      const discountPercentage = Number(createBookingDto.discountPercentage) || 0;
      const originalAmount = Number(createBookingDto.originalAmount) || Number(createBookingDto.totalAmount);
      const discountAmount = discountPercentage > 0 ? Math.round(originalAmount * discountPercentage / 100) : 0;

      const booking = this.bookingRepository.create({
        ...createBookingDto,
        bookingNumber,
        bookingDate: new Date(),
        originalAmount,
        discountPercentage,
        discountAmount,
        paidAmount: createBookingDto.paidAmount || 0,
        pendingAmount: createBookingDto.totalAmount - (createBookingDto.paidAmount || 0),
      });

      const savedBooking = await this.bookingRepository.save(booking) as unknown as Booking;

      // Update plot status to reserved
      await this.plotRepository.update(plot.id, { status: PlotStatus.RESERVED });

      // Create payment schedule
      const paymentType = createBookingDto.paymentType || PaymentType.INSTALLMENT;

      let paymentSchedule;

      if (createBookingDto.paymentPlanId && paymentType === PaymentType.INSTALLMENT) {
        // Use payment plan to create detailed installment schedule
        const paymentPlan = await this.paymentPlanService.findOne(createBookingDto.paymentPlanId);
        if (!paymentPlan) {
          throw new Error('Payment plan not found');
        }

        paymentSchedule = await this.enhancedPaymentScheduleService.createPaymentScheduleFromPlan(
          savedBooking,
          paymentPlan,
          createBookingDto.paidAmount || 0, // Actual down payment made
          undefined, // startDate
          discountPercentage, // Pass discount for installment amount calculation
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

      // Create initial payment record if there's a paid amount
      if (createBookingDto.paidAmount && createBookingDto.paidAmount > 0) {
        // Get the payment schedule that was just created
        const schedule = await this.paymentScheduleService.findByBookingId(savedBooking.id);

        const initialPayment = this.paymentRepository.create({
          paymentScheduleId: schedule?.id,
          amount: createBookingDto.paidAmount,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          transactionId: `BOOKING-${savedBooking.id}-INITIAL`,
          notes: 'Initial down payment made at booking time',
        });

        await this.paymentRepository.save(initialPayment);

        // CRITICAL FIX: Update payment schedule amounts
        // Pass isInitialPayment=true so the down payment does NOT mark monthly installments as paid
        if (schedule) {
          await this.paymentScheduleService.recordPayment(
            schedule.id,
            createBookingDto.paidAmount,
            undefined, // no specific installment IDs
            true,      // isInitialPayment - only mark down_payment_balance, not monthly installments
          );
        }
      }

      return {
        ...savedBooking,
        bookingNumber: savedBooking.bookingNumber,
      };
    } catch (error) {
      console.error('Booking creation error:', error.message);
      throw error;
    }
  }

  @Put(':id')
  async updateBooking(@Param('id') id: string, @Body() updateBookingDto: any) {
    await this.bookingRepository.update(id, updateBookingDto);
    const booking = await this.bookingRepository.findOne({ where: { id } });

    return {
      ...booking,
      bookingNumber: booking.bookingNumber || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
    };
  }

  @Delete(':id')
  async deleteBooking(@Param('id') id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['paymentSchedules'],
    });

    if (!booking) {
      return { message: 'Booking not found' };
    }

    // Update plot status back to available
    if (booking.plotId) {
      await this.plotRepository.update(booking.plotId, { status: PlotStatus.AVAILABLE });
    }

    // Delete all related records in the correct order (children first)
    for (const schedule of (booking.paymentSchedules || [])) {
      // Delete payments linked to this schedule
      await this.paymentRepository.delete({ paymentScheduleId: schedule.id });
      // Delete installments linked to this schedule
      await this.installmentRepository.delete({ paymentScheduleId: schedule.id });
    }

    // Delete payment schedules
    await this.paymentScheduleRepository.delete({ bookingId: id });

    // Also delete any installments directly linked to booking (if any)
    await this.installmentRepository.delete({ bookingId: id });

    // Finally delete the booking itself
    await this.bookingRepository.delete(id);

    return { message: 'Booking and all related records deleted successfully' };
  }

  @Put(':id/status')
  async updateBookingStatus(@Param('id') id: string, @Body() body: { status: BookingStatus }) {
    await this.bookingRepository.update(id, { status: body.status });
    const booking = await this.bookingRepository.findOne({ where: { id } });

    // Sync plot status with booking status
    if (booking?.plotId) {
      if (body.status === BookingStatus.CONFIRMED || body.status === BookingStatus.COMPLETED) {
        await this.plotRepository.update(booking.plotId, { status: PlotStatus.SOLD });
      } else if (body.status === BookingStatus.CANCELLED) {
        await this.plotRepository.update(booking.plotId, { status: PlotStatus.AVAILABLE });
      } else if (body.status === BookingStatus.PENDING) {
        await this.plotRepository.update(booking.plotId, { status: PlotStatus.RESERVED });
      }
    }

    return {
      ...booking,
      bookingNumber: booking.bookingNumber || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
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

    // Compute accurate paid amount from actual completed payments
    const completedPayments = await this.getCompletedPayments(booking.id);
    const actualPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const actualPendingAmount = Number(booking.totalAmount) - actualPaidAmount;

    return {
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber || `BK-${booking.id.substring(0, 8).toUpperCase()}`,
        totalAmount: Number(booking.totalAmount),
        paidAmount: actualPaidAmount,
        pendingAmount: actualPendingAmount,
        downPayment: Number(booking.downPayment),
        paymentProgress: Number(booking.totalAmount) > 0 ? Math.min(100, Math.round((actualPaidAmount / Number(booking.totalAmount)) * 100)) : 0,
      },
      paymentSchedule,
    };
  }

  /**
   * Generate a deterministic, sequential booking number.
   * Format: BK-YYMMDD-NNN (e.g., BK-260304-001)
   */
  private async generateBookingNumber(): Promise<string> {
    const now = new Date();
    const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    // Find today's latest booking number to increment
    const todayPrefix = `BK-${datePrefix}-`;
    const latestBooking = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.bookingNumber LIKE :prefix', { prefix: `${todayPrefix}%` })
      .orderBy('booking.bookingNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (latestBooking?.bookingNumber) {
      const lastSeq = parseInt(latestBooking.bookingNumber.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    return `BK-${datePrefix}-${String(sequence).padStart(3, '0')}`;
  }

  private async getCompletedPayments(bookingId: string): Promise<Payment[]> {
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.paymentSchedule', 'schedule')
      .where('schedule.bookingId = :bookingId', { bookingId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getMany();
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