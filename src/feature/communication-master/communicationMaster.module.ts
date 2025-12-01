import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { CommunicationMasterService } from './service/';
import { CommunicationMasterSchema } from './schema';
import { CommunicationMasterController } from './controllers';
import { model } from 'mongoose';
import { CommunicationMasterRepository } from './repository';
import { CommunicationMasterModeModule } from 'feature/communication-master-modes/communication_master_mode.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'communicationMaster', schema: CommunicationMasterSchema }]),
    CommunicationMasterModeModule
  ],
  providers: [CommunicationMasterService, CommunicationMasterRepository],
  controllers: [CommunicationMasterController],
  exports: [CommunicationMasterService, CommunicationMasterRepository]
})
export class CommunicationMasterModule {}
