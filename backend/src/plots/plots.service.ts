import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plot, PlotStatus } from './plot.entity';
import { PlotOwnershipHistory, OwnershipType } from './plot-ownership-history.entity';
import { Booking } from '../bookings/booking.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntity, AuditSeverity } from '../audit/audit-log.entity';

@Injectable()
export class PlotsService {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(PlotOwnershipHistory)
    private ownershipHistoryRepository: Repository<PlotOwnershipHistory>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private auditService: AuditService,
  ) {}

  async recordPlotSale(
    plotId: string,
    customerId: string,
    bookingId: string,
    salePrice: number,
    registrationDate: Date,
    registrationNumber: string,
    recordedBy: string,
    notes?: string,
  ): Promise<PlotOwnershipHistory> {
    // Get plot details for audit
    const plot = await this.plotRepository.findOne({ where: { id: plotId } });
    
    // Update plot status
    await this.plotRepository.update(plotId, { status: PlotStatus.SOLD });

    // Create ownership history record
    const ownershipRecord = this.ownershipHistoryRepository.create({
      plotId,
      customerId,
      bookingId,
      ownershipType: OwnershipType.SALE,
      salePrice,
      registrationDate,
      registrationNumber,
      recordedBy,
      notes,
    });

    const savedRecord = await this.ownershipHistoryRepository.save(ownershipRecord);

    // Audit log
    await this.auditService.log(
      recordedBy,
      AuditAction.CREATE,
      AuditEntity.PLOT,
      `Plot sale recorded: ${plot?.plotNumber} sold for PKR ${salePrice} with registration ${registrationNumber}`,
      {
        entityId: plotId,
        newValues: { salePrice, registrationNumber, registrationDate },
        severity: AuditSeverity.HIGH,
        isSensitive: true,
      },
    );

    return savedRecord;
  }

  async recordPlotTransfer(
    plotId: string,
    newCustomerId: string,
    transferDate: Date,
    transferDocumentNumber: string,
    recordedBy: string,
    notes?: string,
  ): Promise<PlotOwnershipHistory> {
    // Get plot details for audit
    const plot = await this.plotRepository.findOne({ where: { id: plotId } });
    
    // Update plot status
    await this.plotRepository.update(plotId, { status: PlotStatus.TRANSFERRED });

    // Create ownership history record
    const ownershipRecord = this.ownershipHistoryRepository.create({
      plotId,
      customerId: newCustomerId,
      ownershipType: OwnershipType.TRANSFER,
      transferDate,
      transferDocumentNumber,
      recordedBy,
      notes,
    });

    const savedRecord = await this.ownershipHistoryRepository.save(ownershipRecord);

    // Audit log
    await this.auditService.log(
      recordedBy,
      AuditAction.UPDATE,
      AuditEntity.PLOT,
      `Plot transfer recorded: ${plot?.plotNumber} transferred with document ${transferDocumentNumber}`,
      {
        entityId: plotId,
        newValues: { transferDate, transferDocumentNumber, newCustomerId },
        severity: AuditSeverity.HIGH,
        isSensitive: true,
      },
    );

    return savedRecord;
  }

  async getPlotOwnershipHistory(plotId: string): Promise<PlotOwnershipHistory[]> {
    return await this.ownershipHistoryRepository.find({
      where: { plotId },
      relations: ['customer', 'booking', 'recordedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCurrentPlotOwner(plotId: string): Promise<PlotOwnershipHistory | null> {
    return await this.ownershipHistoryRepository.findOne({
      where: { plotId },
      relations: ['customer', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }
}

