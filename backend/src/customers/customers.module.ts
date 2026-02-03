import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { Lead } from '../leads/lead.entity';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Lead])],
  providers: [],
  controllers: [CustomersController],
  exports: [],
})
export class CustomersModule {} 