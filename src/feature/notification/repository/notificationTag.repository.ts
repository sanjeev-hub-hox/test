
import { NotificationTagModel, NotificationTagDocument } from "../schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TNotificationTag } from '../type';

@Injectable()
export class NotificationTagRepository {
  constructor(
    @InjectModel("notificationTag")
    private notificationTagModel: NotificationTagModel
  ) {}

  create(createData: TNotificationTag): Promise<NotificationTagDocument> {
    return this.notificationTagModel.create(createData);
  }
}
