import { HttpException, HttpStatus } from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';
import { initNotificationTestModule } from '../notification.module';
import { NotificationService } from '../../service';
import {
  NotificationToUserRepository,
  NotificationTagRepository,
  NotificationChannelRepository,
  NotificationRepository
} from '../../repository';
import { initTemplateTestModule } from '../../../template/test/template.module';
import { TemplateRepository } from '../../../template/template.repository';
import { templateData } from '../../../template/test/mocks';
import { Template } from '../../../template/template.schema';
import { ESendNotificationChannels, TNotificationToUser } from '../../../notification/type';

describe('notification service test suite', () => {
  let notificationService: jest.MockedObject<NotificationService>;
  let notificationToUserRepository: jest.MockedObject<NotificationToUserRepository>;
  let notificationTagRepository: jest.MockedObject<NotificationTagRepository>;
  let notificationChannelRepository: jest.MockedObject<NotificationChannelRepository>;
  let notificationRepository: jest.MockedObject<NotificationRepository>;
  let templateRepository: Pick<jest.MockedObject<TemplateRepository>, 'getOne'>;

  beforeAll(async () => {
    const notificationModule = await initNotificationTestModule();
    const templateModule = await initTemplateTestModule();
    notificationService = notificationModule.notificationService;
    notificationToUserRepository = notificationModule.notificationToUserRepository;
    notificationTagRepository = notificationModule.notificationTagRepository;
    notificationChannelRepository = notificationModule.notificationChannelRepository;
    notificationRepository = notificationModule.notificationRepository;
    templateRepository = templateModule.templateRepository;
  });

  it('checkTemplateExistence should return proper template data if the passed template slug is proper', async () => {
    const slug = 'reminder-template';
    templateRepository.getOne.mockImplementationOnce((slugFilter) => {
      const template = templateData.find((template) => template.slug === slugFilter.slug);
      return Promise.resolve<HydratedDocument<Template>>(template as any);
    });
    const result = await notificationService.checkTemplateExistence(slug);
    expect(result).toEqual(templateData[0]);
  });

  it('checkTemplateExistence should throw an Http exception if unknown slug is given as an input', async () => {
    const slug = 'unknown-slug';
    templateRepository.getOne.mockImplementationOnce((slugFilter) => {
      const template = templateData.find((template) => template.slug === slugFilter.slug);
      return Promise.resolve<HydratedDocument<Template>>(template as any);
    });
    try {
      await notificationService.checkTemplateExistence(slug);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.message).toEqual('Template not found');
      expect(err.getStatus()).toEqual(HttpStatus.NOT_FOUND);
    }
  });

  it('getReadCount should give proper read count', async () => {
    const portalId = 1;
    const userId = 1;

    notificationToUserRepository.aggregate.mockImplementationOnce(([]) => {
      if (!userId || !portalId) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve([
          {
            _id: {
              readAtNull: true
            },
            count: 1
          },
          {
            _id: {
              readAtNull: false
            },
            count: 2
          }
        ]);
      }
    });

    const result = await notificationService.getReadCount(portalId, userId);
    expect(result.read).toBeDefined();
    expect(result.read).toBeGreaterThan(0);
    expect(result.unread).toBeDefined();
    expect(result.unread).toBeGreaterThan(0);
    expect(result.all).toBeDefined();
    expect(result.unread).toBeGreaterThan(0);
  });

  it('getReadCount should give read count 0 if no data is found', async () => {
    const portalId = 1;
    const userId = null;

    notificationToUserRepository.aggregate.mockImplementationOnce(([]) => {
      if (!userId || !portalId) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve([
          {
            _id: {
              readAtNull: true
            },
            count: 1
          },
          {
            _id: {
              readAtNull: false
            },
            count: 2
          }
        ]);
      }
    });

    const result = await notificationService.getReadCount(portalId, userId);
    expect(result.read).toBeDefined();
    expect(result.read).toEqual(0);
    expect(result.unread).toBeDefined();
    expect(result.unread).toEqual(0);
    expect(result.all).toBeDefined();
    expect(result.unread).toEqual(0);
  });

  it('sendNotification should throw an HttpException if portal Ids sent are incorrect', async () => {
    const payload = {
      userIds: [1, 2, 3],
      channels: [
        {
          name: ESendNotificationChannels.inApp,
          subject: 'Test notification 2',
          body: 'This is a test template 2'
        }
      ],
      generated_from_portal_id: 4,
      generated_to_portal_id: 1,
      type: 'Notification',
      added_by: 100
    };
    try {
      await notificationService.sendNotification(payload);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.message).toEqual(
        'Invalid generated_from_portal_id or generated_to_portal_id sent'
      );
      expect(err.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
    }
  });

  it('sendNotification should throw an HttpException if incorrect channel name is sent', async () => {
    const payload = {
      userIds: [1, 2, 3],
      channels: [
        {
          name: ESendNotificationChannels.email,
          subject: 'Test notification 2',
          body: 'This is a test template 2'
        }
      ],
      generated_from_portal_id: 2,
      generated_to_portal_id: 1,
      type: 'Notification',
      added_by: 100
    };
    try {
      await notificationService.sendNotification(payload);
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.message).toEqual('Invalid channel name sent');
      expect(err.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
    }
  });

  it('sendNotification should return true if all the checks are passed and notification is been sent', async () => {
    const payload = {
      userIds: [1, 2, 3],
      channels: [
        {
          name: ESendNotificationChannels.inApp,
          subject: 'Test notification 2',
          body: 'This is a test template 2'
        }
      ],
      generated_from_portal_id: 2,
      generated_to_portal_id: 1,
      type: 'Notification',
      added_by: 100
    };

    notificationRepository.create.mockResolvedValueOnce(Promise.resolve({} as any));
    notificationToUserRepository.getOne.mockResolvedValueOnce(Promise.resolve({} as any));

    const result = await notificationService.sendNotification(payload);
    expect(result).toEqual(true);
  });

  it('subscribeInAppNotification should return true', async () => {
    const payload = {
      userId: 1,
      channel: ESendNotificationChannels.inApp,
      notificationId: new Types.ObjectId()
    };

    const mockMappingData = () => {
      return new Promise((resolve) => {
        resolve({
          _id: new Types.ObjectId('6641d390ca9ae2f58dba6d49'),
          notification_id: new Types.ObjectId('6641d390ca9ae2f58dba6d3e'),
          user_id: 3,
          read_at: null,
          read_on_portal_id: null,
          delivery_channel_status: [
            {
              channel: 'In-app',
              delivery_status: 'SUCCESS',
              delivered_at: '2024-05-13T08:47:12.448Z',
              failed_count: 0
            }
          ],
          deleted_at: null,
          created_at: '2024-05-13T08:47:12.449Z',
          updated_at: '2024-05-20T11:02:00.059Z',
          __v: 0
        });
      });
    };
    notificationToUserRepository.getOne.mockResolvedValueOnce(mockMappingData());
    const result = await notificationService.subscribeInAppNotification(payload);
    expect(result).toEqual(true);
  });
});
