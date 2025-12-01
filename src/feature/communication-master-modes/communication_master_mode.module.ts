import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CommunicationMasterMode,
  CommunicationMasterModeSchema
} from './communication_master_mode.schema';
import { CommunicationMasterModeRepository } from './communication_master_mode.repository';
import { CommunicationMasterModeService } from './communication_master_mode.service';
import { CommunicationMasterModeController } from './communication_master_mode.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationMasterMode.name, schema: CommunicationMasterModeSchema }
    ])
  ],
  controllers: [CommunicationMasterModeController],
  providers: [CommunicationMasterModeService, CommunicationMasterModeRepository],
  exports: [CommunicationMasterModeService, CommunicationMasterModeRepository, MongooseModule]
})
export class CommunicationMasterModeModule {}
