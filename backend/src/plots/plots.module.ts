import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plot } from './plot.entity';
import { PlotSizePricing } from './plot-size-pricing.entity';
import { PlotOwnershipHistory } from './plot-ownership-history.entity';
import { PlotsController } from './plots.controller';
import { PlotSizePricingController } from './plot-size-pricing.controller';
import { PlotSizePricingService } from './plot-size-pricing.service';
import { PlotsService } from './plots.service';
import { Booking } from '../bookings/booking.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plot, PlotSizePricing, PlotOwnershipHistory, Booking]),
    AuditModule,
  ],
  providers: [PlotSizePricingService, PlotsService],
  controllers: [PlotsController, PlotSizePricingController],
  exports: [TypeOrmModule, PlotSizePricingService, PlotsService],
})
export class PlotsModule {} 