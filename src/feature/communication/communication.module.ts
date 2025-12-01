import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller'; // Import the controller
import { CommunicationRepository } from './communication.repository';
import { Communication, CommunicationSchema } from './communication.schema';
import { CommunicationMasterService } from 'feature/communication-master/service';
import { CommunicationMasterRepository } from 'feature/communication-master/repository';
import { CommunicationMasterModule } from 'feature/communication-master/communicationMaster.module';
import { CommunicationMasterModeModule } from '../communication-master-modes/communication_master_mode.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Communication.name, schema: CommunicationSchema }]),
    CommunicationMasterModule,
    CommunicationMasterModeModule,
    forwardRef(() => NotificationModule)
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationRepository],
  exports: [CommunicationService]
})
export class CommunicationModule {}
