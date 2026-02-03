import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.guard';
import { SalesManagerDashboardService } from './sales-manager-dashboard.service';

@Controller('dashboard/sales-manager')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesManagerDashboardController {
  constructor(private salesManagerDashboardService: SalesManagerDashboardService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_SALES_ANALYTICS)
  async getSalesManagerDashboard(@Request() req) {
    console.log('Sales Manager Dashboard Controller - User:', req.user);
    console.log('Sales Manager Dashboard Controller - User ID:', req.user.userId);
    return await this.salesManagerDashboardService.getSalesManagerDashboard(req.user.userId);
  }
}
