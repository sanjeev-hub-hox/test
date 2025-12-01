import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationMode, CommunicationModeSchema } from './communication_mode.schema';
import { CommunicationModeRepository } from './communication_mode.repository';
import { CommunicationModeService } from './communication_mode.service';
import { CommunicationModeController } from './communication_mode.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CommunicationMode.name, schema: CommunicationModeSchema }])
  ],
  controllers: [CommunicationModeController],
  providers: [CommunicationModeService, CommunicationModeRepository],
  exports: [CommunicationModeService, CommunicationModeRepository]
})
export class CommunicationModeModule {}
