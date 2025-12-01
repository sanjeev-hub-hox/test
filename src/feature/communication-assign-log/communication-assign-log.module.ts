import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommunicationAssignLog,
  CommunicationAssignLogSchema
} from './communication-assign-log.schema';
import { CommunicationAssignLogRepository } from './communication-assign-log.repository';
import { CommunicationAssignLogService } from './communication-assign-log.service';
import { CommunicationAssignLogController } from './communication-assign-log.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationAssignLog.name, schema: CommunicationAssignLogSchema }
    ])
  ],
  controllers: [CommunicationAssignLogController],
  providers: [CommunicationAssignLogService, CommunicationAssignLogRepository]
})
export class CommunicationAssignLogModule {}
