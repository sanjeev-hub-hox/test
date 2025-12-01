import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  NotificationService,
  NotificationChannelService,
  NotificationTagService,
  NotificationTypeService,
  NotificationToUserService
} from './service/';
import {
  NotificationSchema,
  NotificationChannelSchema,
  NotificationDeliveryStatusSchema,
  NotificationTagSchema,
  NotificationToUserSchema,
  NotificationTypeSchema,
  NotificationTag,
  OtpSchema
} from './schema';
import { NotificationController, NotificationTypeController } from './controllers';
import { model } from 'mongoose';
import { NotificationToUserRepository } from './repository/notificationToUser.repository';
import { TemplateModule } from '../template/template.module';
import {
  NotificationChannelRepository,
  NotificationTagRepository,
  NotificationRepository,
  OtpRepository
} from './repository';
import { CommunicationMasterModeRepository } from 'feature/communication-master-modes/communication_master_mode.repository';
import { CommunicationMasterModeModule } from 'feature/communication-master-modes/communication_master_mode.module';
import { MailService } from 'utils/mailer';
import { MessageService } from './service/sms';
import { FirebaseService } from 'utils/firebase';
import {
  LocalStorageService,
  StorageService,
  S3StorageService,
  GoogleCloudStorageService
} from 'ampersand-common-module';
import { CommunicationMasterModule } from '../communication-master/communicationMaster.module';
import { CommunicationModeModule } from '../communication-modes/communication_mode.module';
import { CommunicationModule } from '../communication/communication.module';
import { ConfigService } from '@nestjs/config';
import { AuditLogRepository, AuditLogSchema } from 'ampersand-common-module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'notification', schema: NotificationSchema },
      { name: 'notificationChannel', schema: NotificationChannelSchema },
      {
        name: 'notificationDeliveryStatus',
        schema: NotificationDeliveryStatusSchema
      },
      { name: 'notificationTag', schema: NotificationTagSchema },
      { name: 'notificationToUser', schema: NotificationToUserSchema },
      { name: 'notificationType', schema: NotificationTypeSchema },
      { name: 'auditLogs', schema: AuditLogSchema },
      { name: 'otp', schema: OtpSchema }
    ]),
    TemplateModule,
    CommunicationMasterModeModule,
    CommunicationMasterModule,
    CommunicationModeModule,
    forwardRef(() => CommunicationModule)
  ],
  providers: [
    NotificationService,
    NotificationChannelService,
    NotificationTagService,
    {
      provide: getModelToken(NotificationTag.name),
      useValue: model
    },
    NotificationTypeService,
    NotificationToUserService,
    NotificationToUserRepository,
    NotificationTagRepository,
    NotificationChannelRepository,
    NotificationRepository,
    OtpRepository,
    MailService,
    MessageService,
    FirebaseService,
    StorageService,
    LocalStorageService,
    S3StorageService,
    GoogleCloudStorageService,
    AuditLogRepository,
    ConfigService
  ],
  controllers: [NotificationController, NotificationTypeController],
  exports: [
    NotificationService,
    NotificationChannelService,
    NotificationTagService,
    NotificationTypeService,
    NotificationToUserService,
    NotificationToUserRepository,
    NotificationTagRepository,
    NotificationChannelRepository,
    NotificationRepository,
    OtpRepository
  ]
})
export class NotificationModule {}
