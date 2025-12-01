import { Types } from 'mongoose';

export type TNotificationChannel = {
  _id?: Types.ObjectId;
  channel: string;
  notification_id: Types.ObjectId;
  template_id?: Types.ObjectId;
  status: ENotificationChannelStatus;
  created_at?: Date;
  updated_at?: Date;
};

export enum ENotificationChannelStatus {
  Pending = 'Pending',
  Success = 'Success',
  Failed = 'Failed'
}
