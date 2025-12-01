import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationLogService } from './communication-log.service';
import { CommunicationLogController } from './communication-log.controller';
import { CommunicationLogRepository } from './communication-log.repository';
import { CommunicationLog, CommunicationLogSchema } from './communication-log.schema';
import { NotificationModule } from '../notification/notification.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CommunicationLog.name, schema: CommunicationLogSchema }]),
    CommunicationModule,
    NotificationModule
  ],
  controllers: [CommunicationLogController],
  providers: [CommunicationLogService, CommunicationLogRepository],
  exports: [CommunicationLogService]
})
export class CommunicationLogModule {}
