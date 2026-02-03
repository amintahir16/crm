import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstructionProject } from './construction-project.entity';
import { ConstructionPhase } from './construction-phase.entity';
import { ConstructionTask } from './construction-task.entity';
import { ConstructionExpense } from './construction-expense.entity';
import { ConstructionDocument } from './construction-document.entity';
import { ConstructionService } from './construction.service';
import { ConstructionController } from './construction.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConstructionProject,
      ConstructionPhase,
      ConstructionTask,
      ConstructionExpense,
      ConstructionDocument,
    ]),
  ],
  providers: [ConstructionService],
  controllers: [ConstructionController],
  exports: [ConstructionService],
})
export class ConstructionModule {}
