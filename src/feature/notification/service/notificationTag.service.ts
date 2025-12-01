import { NotificationTagModel, NotificationTagDocument } from '../schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TNotificationTag } from '../type';

@Injectable()
export class NotificationTagService {
  constructor(
    @InjectModel('notificationTag')
    private model: NotificationTagModel
  ) {}

  create(createData: TNotificationTag): Promise<NotificationTagDocument> {
    return this.model.create(createData);
  }
}
