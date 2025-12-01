import { Test } from '@nestjs/testing';
import { NotificationController, NotificationTypeController } from '../controllers';
import {
  NotificationToUserRepository,
  NotificationTagRepository,
  NotificationChannelRepository,
  NotificationRepository
} from '../repository';
import {
  NotificationService,
  NotificationChannelService,
  NotificationTagService,
  NotificationTypeService,
  NotificationToUserService
} from '../service';
import { LoggerService, ResponseService } from '../../../utils';
import {
  notificationToUserMockedRepository,
  notificationTagMockedRepository,
  notificationChannelMockedRepository,
  notificationMockedRepository
} from './repository';
import {
  notificationChannelModel,
  notificationModel,
  notificationTagModel,
  notificationToUserModel,
  notificationTypeModel
} from './model';
import { templateMockedRepository } from '../../template/test/template.repository';
import { TemplateRepository } from '../../template/template.repository';

export const initNotificationTestModule = async () => {
  const notificationTestModule = await Test.createTestingModule({
    imports: [],
    controllers: [NotificationController, NotificationTypeController],
    providers: [
      NotificationService,
      NotificationChannelService,
      NotificationTagService,
      NotificationTypeService,
      NotificationToUserService,
      {
        provide: NotificationToUserRepository,
        useValue: notificationToUserMockedRepository
      },
      {
        provide: 'notificationToUserModel',
        useFactory: () => notificationToUserModel
      },
      {
        provide: NotificationTagRepository,
        useValue: notificationTagMockedRepository
      },
      {
        provide: 'notificationTagModel',
        useFactory: () => notificationTagModel
      },
      {
        provide: NotificationChannelRepository,
        useValue: notificationChannelMockedRepository
      },
      {
        provide: 'notificationChannelModel',
        useFactory: () => notificationChannelModel
      },
      {
        provide: NotificationRepository,
        useValue: notificationMockedRepository
      },
      {
        provide: 'notificationModel',
        useFactory: () => notificationModel
      },
      {
        provide: 'notificationTypeModel',
        useFactory: () => notificationTypeModel
      },
      {
        provide: TemplateRepository,
        useValue: templateMockedRepository
      },
      {
        provide: LoggerService,
        useValue: {
          log: jest.fn(),
          error: jest.fn()
        }
      },
      {
        provide: ResponseService,
        useValue: {
          sendResponse: jest.fn(),
          errorResponse: jest.fn()
        }
      }
    ]
  }).compile();

  const notificationController: jest.MockedObject<NotificationController> =
    await notificationTestModule.get(NotificationController);

  const notificationService: jest.MockedObject<NotificationService> =
    await notificationTestModule.get(NotificationService);

  const notificationChannelService: jest.MockedObject<NotificationChannelService> =
    await notificationTestModule.get(NotificationChannelService);

  const notificationTagService: jest.MockedObject<NotificationTagService> =
    await notificationTestModule.get(NotificationTagService);

  const notificationTypeService: jest.MockedObject<NotificationTypeService> =
    await notificationTestModule.get(NotificationTypeService);

  const notificationToUserService: jest.MockedObject<NotificationToUserService> =
    await notificationTestModule.get(NotificationToUserService);

  const notificationToUserRepository: jest.MockedObject<NotificationToUserRepository> =
    await notificationTestModule.get(NotificationToUserRepository);

  const notificationTagRepository: jest.MockedObject<NotificationTagRepository> =
    await notificationTestModule.get(NotificationTagRepository);

  const notificationChannelRepository: jest.MockedObject<NotificationChannelRepository> =
    await notificationTestModule.get(NotificationChannelRepository);

  const notificationRepository: jest.MockedObject<NotificationRepository> =
    await notificationTestModule.get(NotificationRepository);

  const templateRepository: jest.MockedObject<TemplateRepository> =
    await notificationTestModule.get(TemplateRepository);

  return {
    notificationController,
    notificationService,
    notificationChannelService,
    notificationTagService,
    notificationTypeService,
    notificationToUserService,
    notificationToUserRepository,
    notificationTagRepository,
    notificationChannelRepository,
    notificationRepository,
    templateRepository
  };
};
