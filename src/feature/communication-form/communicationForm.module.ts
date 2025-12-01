import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationFormController } from './controllers';
import { CommunicationFormSchema } from './schema/communicationForm.schema';
import { CommunicationFormRepository } from './repository/communicationForm.repository';
import { CommunicationFormService } from './service/communicationForm.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'communicationForm', schema: CommunicationFormSchema }])
  ],
  providers: [CommunicationFormService, CommunicationFormRepository],
  controllers: [CommunicationFormController],
  exports: [CommunicationFormService, CommunicationFormRepository]
})
export class CommunicationFormModule {}
