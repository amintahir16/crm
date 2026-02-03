import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { Message, MessageAttachment } from './message.entity';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Message, MessageAttachment])],
  providers: [CommunicationService],
  controllers: [CommunicationController],
  exports: [CommunicationService],
})
export class CommunicationModule {}
