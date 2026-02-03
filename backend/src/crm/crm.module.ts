import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerInteraction } from './customer-interaction.entity';
import { CustomerInteractionController } from './customer-interaction.controller';
import { CustomerInteractionService } from './customer-interaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerInteraction])],
  providers: [CustomerInteractionService],
  controllers: [CustomerInteractionController],
  exports: [CustomerInteractionService],
})
export class CrmModule {}
