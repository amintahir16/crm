import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
