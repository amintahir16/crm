import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  async getFinanceOverview(@Request() req) {
    const stats = await this.financeService.getFinancialStats();
    const recentTransactions = await this.financeService.getRecentTransactions();
    
    return {
      stats,
      recentTransactions,
    };
  }

  @Get('accounts')
  async getChartOfAccounts() {
    return await this.financeService.getChartOfAccounts();
  }

  @Post('accounts')
  async createAccount(@Body() createAccountDto: any) {
    return await this.financeService.createAccount(createAccountDto);
  }

  @Get('journal')
  async getJournalEntries() {
    return await this.financeService.getJournalEntries();
  }

  @Post('journal')
  async createJournalEntry(@Body() createJournalEntryDto: any) {
    return await this.financeService.createJournalEntry(createJournalEntryDto);
  }

  @Get('reconciliation')
  async getBankReconciliation() {
    return await this.financeService.getBankReconciliation();
  }

  @Get('tax')
  async getTaxSummary() {
    return await this.financeService.getTaxSummary();
  }
} 