import { Document } from "mongoose";
import {
  NotificationChannelModel,
  NotificationChannelDocument,
} from "../schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TNotificationChannel } from '../type';

@Injectable()
export class NotificationChannelService {
  constructor(
    @InjectModel("notificationChannel")
    private model: NotificationChannelModel
  ) {}

  create(
    createData: TNotificationChannel
  ): Promise<NotificationChannelDocument> {
    return this.model.create(createData);
  }
}
