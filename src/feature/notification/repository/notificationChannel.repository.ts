import {
  NotificationChannelModel,
  NotificationChannelDocument,
} from "../schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TNotificationChannel } from '../type';

@Injectable()
export class NotificationChannelRepository {
  constructor(
    @InjectModel("notificationChannel")
    private notificationChannelModel: NotificationChannelModel
  ) {}

  create(
    createData: TNotificationChannel
  ): Promise<NotificationChannelDocument> {
    return this.notificationChannelModel.create(createData);
  }
}