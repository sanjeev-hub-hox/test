import { NotificationModel, NotificationDocument } from '../schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TNotification } from '../type';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel('notification')
    private notificationModel: NotificationModel
  ) {}

  create(createData: TNotification): Promise<NotificationDocument> {
    return this.notificationModel.create(createData);
  }

  aggregate(pipeline: any): Promise<any> {
    return this.notificationModel.aggregate(pipeline);
  }
}
