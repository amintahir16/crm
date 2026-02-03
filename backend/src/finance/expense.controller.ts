import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpenseService } from './expense.service';
import { Expense, ExpenseCategory, ExpenseStatus } from './expense.entity';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async createExpense(
    @Body() createExpenseDto: {
      expenseName: string;
      category: ExpenseCategory;
      amount: number;
      expenseDate: string;
      dueDate?: string;
      description?: string;
      vendorName?: string;
      vendorContact?: string;
      invoiceNumber?: string;
      accountId?: string;
    },
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.createExpense({
      ...createExpenseDto,
      expenseDate: new Date(createExpenseDto.expenseDate),
      dueDate: createExpenseDto.dueDate ? new Date(createExpenseDto.dueDate) : undefined,
      submittedBy: user.id,
    });
  }

  @Get()
  async getAllExpenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('status') status?: ExpenseStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.getAllExpenses({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      category,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('summary')
  async getExpenseSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    return this.expenseService.getExpenseSummary(dateRange);
  }

  @Get(':id')
  async getExpenseById(@Param('id', ParseUUIDPipe) id: string): Promise<Expense> {
    return this.expenseService.getExpenseById(id);
  }

  @Put(':id')
  async updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: Partial<Expense>,
  ): Promise<Expense> {
    return this.expenseService.updateExpense(id, updateExpenseDto);
  }

  @Put(':id/approve')
  async approveExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: { approved: boolean; rejectionReason?: string },
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.approveExpense(
      id,
      user.id,
      approveDto.approved,
      approveDto.rejectionReason,
    );
  }

  @Put(':id/mark-paid')
  async markExpenseAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markPaidDto: {
      paidAmount: number;
      paidDate: string;
      paymentMethod: string;
      receiptNumber?: string;
      referenceNumber?: string;
    },
  ): Promise<Expense> {
    return this.expenseService.markExpenseAsPaid(
      id,
      markPaidDto.paidAmount,
      new Date(markPaidDto.paidDate),
      markPaidDto.paymentMethod,
      markPaidDto.receiptNumber,
      markPaidDto.referenceNumber,
    );
  }

  @Delete(':id')
  async deleteExpense(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.expenseService.deleteExpense(id);
    return { message: 'Expense deleted successfully' };
  }
}

