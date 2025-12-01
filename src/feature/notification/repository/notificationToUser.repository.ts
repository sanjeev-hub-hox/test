import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotificationToUserDocument, NotificationToUserModel } from '../schema';
import { CommunicationService } from '../../communication/communication.service';
import { CommunicationMasterService } from '../../communication-master/service/communicationMaster.service';
import { NotificationService } from '../service/notification.service';
import { TNotificationToUser } from '../type';
import { NOTIFICATION_LIST_TYPE, ANNOUNCEMENT_ID } from 'utils';
import moment from 'moment';

@Injectable()
export class NotificationToUserRepository {
  constructor(
    @InjectModel('notificationToUser') private notificationToUserModel: NotificationToUserModel,
    private communicationService: CommunicationService,
    private communicationMasterService: CommunicationMasterService,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService
  ) {}

  create(createData: TNotificationToUser): Promise<NotificationToUserDocument> {
    return this.notificationToUserModel.create(createData);
  }
  async createMany(createData: TNotificationToUser[]): Promise<NotificationToUserDocument[]> {
    const bulkOps = createData.map((data) => ({
      updateOne: {
        filter: {
          communication_id: data.communication_id,
          communication_master_id: data.communication_master_id,
          group_id: data.group_id,
          user_id: data.user_id
        },
        update: { $set: data },
        upsert: true,
        setDefaultsOnInsert: true
      }
    }));

    this.notificationToUserModel.bulkWrite(bulkOps);

    return [];
  }

  getOne(
    filter: Record<string, any>,
    project?: Record<string, number> | {}
  ): Promise<Partial<TNotificationToUser>> {
    return this.notificationToUserModel.findOne(filter, { __v: 0, ...project });
  }

  getMany(
    filter: Record<string, any> | {},
    project?: Record<string, number> | {},
    limit?: number
  ): Promise<Partial<NotificationToUserDocument>[]> {
    return this.notificationToUserModel
      .find(filter, { __v: 0, _id: 0, ...project })
      .limit(limit ?? 10);
  }

  async updateById(id: Types.ObjectId, data: any): Promise<any> {
    const response = await this.notificationToUserModel.findByIdAndUpdate(id, data, {
      new: true
    });
    return response;
  }

  async updateOne(
    filter: Record<string, any>,
    data: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    const response = await this.notificationToUserModel.updateOne(filter, data, options);
    return response;
  }

  async updateMany(
    filter: Record<string, any>,
    data: Partial<TNotificationToUser>,
    options?: Record<string, any>
  ): Promise<any> {
    const response = await this.notificationToUserModel.updateMany(filter, data, options);
    return response;
  }

  async deleteByCommunicationId(communication_id: string) {
    return await this.notificationToUserModel.deleteMany({
      communication_id: communication_id
    });
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.notificationToUserModel.aggregate(pipeline);
  }

  async getUserNotification(
    user_id: number,
    user_type: number
  ): Promise<Partial<NotificationToUserDocument>[]> {
    return await this.notificationToUserModel.find({
      user_id: user_id,
      user_type: user_type
    });
  }

  async getUserNotificationWithFilters(
    user_id: number,
    user_type: number,
    type: string,
    communication_master_id: string,
    page: number,
    limit: number,
    isWebApp: boolean = false
  ): Promise<{ data: Partial<NotificationToUserDocument>[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = {
      user_id: user_id,
      user_type: user_type
    };

    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const weekStart = moment().startOf('week').toDate();
    const weekEnd = moment().endOf('week').toDate();

    switch (type) {
      case NOTIFICATION_LIST_TYPE.all_today:
        filter.created_at = { $gte: todayStart, $lte: todayEnd };
        break;

      case NOTIFICATION_LIST_TYPE.read_today:
        filter.read_at = { $ne: null };
        filter.created_at = { $gte: todayStart, $lte: todayEnd };
        break;

      case NOTIFICATION_LIST_TYPE.unread_today:
        filter.read_at = { $eq: null };
        filter.created_at = { $gte: todayStart, $lte: todayEnd };
        break;

      case NOTIFICATION_LIST_TYPE.all_this_week:
        filter.created_at = { $gte: weekStart, $lte: weekEnd };
        break;

      case NOTIFICATION_LIST_TYPE.read_this_week:
        filter.read_at = { $ne: null };
        filter.created_at = { $gte: weekStart, $lte: weekEnd };
        break;

      case NOTIFICATION_LIST_TYPE.unread_this_week:
        filter.read_at = { $eq: null };
        filter.created_at = { $gte: weekStart, $lte: weekEnd };
        break;

      case NOTIFICATION_LIST_TYPE.active:
        filter.published_date = { $lte: new Date(todayEnd) };
        filter.end_date = { $gte: new Date(todayStart) };
        break;

      default:
        throw new Error('Invalid notification type');
    }

    if (communication_master_id) {
      filter.communication_master_id = { $eq: communication_master_id };
    }

    if ('active' == type) {
      if (isWebApp) {
        filter[`mode.${ANNOUNCEMENT_ID}`] = { $exists: true };
      } else {
        filter['mode.6729de5d0c694d10cd79d2f1'] = { $exists: true };
      }
    } else {
      filter[`mode.${ANNOUNCEMENT_ID}`] = { $exists: false };
    }

    let [notifications] = await Promise.all([
      this.notificationToUserModel.find(filter).sort({ _id: -1 }).skip(skip).limit(limit)
      //   this.notificationToUserModel.countDocuments(filter)
    ]);
    notifications = JSON.parse(JSON.stringify(notifications));

    console.log('Notificaitons', notifications);
    console.log('Notificaitons Filter', filter);

    let data = [];
    if (notifications.length > 0) {
      for (const index in notifications) {
        let notification = notifications[index];

        let communication = await this.communicationService.findById(notification.communication_id);

        if (communication && communication.attachment) {
          let attachmentList = [];
          for (let file of communication.attachment) {
            let attachment = await this.notificationService.getUploadedDocumentUrl(file);
            attachmentList.push(attachment);
          }
          notification['attachment'] = attachmentList;
        }

        if (communication && communication.attachmentFiles) {
          let attachmentFilesList = [];
          for (let file of communication.attachmentFiles) {
            let url = await this.notificationService.getUploadedDocumentUrl(file.url);
            let attachment = {
              url: url,
              fileName: file.fileName
            };
            attachmentFilesList.push(attachment);
          }
          notification['attachmentFiles'] = attachmentFilesList;
        }

        if (communication && communication.formId && '' != communication.formId) {
          notification['formId'] = communication.formId;
        }

        if (communication && communication.formSlug && '' != communication.formSlug) {
          notification['formSlug'] = communication.formSlug;
        }

        if (communication && communication.formId && '' != communication.formId) {
          notification['formId'] = communication.formId;
        }

        if (communication && communication.formSlug && '' != communication.formSlug) {
          notification['formSlug'] = communication.formSlug;
        }

        let communication_master = await this.communicationMasterService.getById(
          notification.communication_master_id
        );
        // notification['communication_master_slug'] = communication_master?.slug;
        notification['communication_master_slug'] =
          communication?.destination ||
          communication_master?.destination ||
          communication_master?.slug ||
          '';
        notification['created_on'] = moment
          .utc(notification['created_at'])
          .local()
          .fromNow()
          .replace(/^in /, '');
        notification['from'] = communication_master?.fromValue;

        if ('closed' != communication?.status) {
          data.push(notification);
        }
      }
    }

    return { data: data, totalCount: data.length };
  }
}
