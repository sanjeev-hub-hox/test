import { Types } from 'mongoose';

export type TNotificationToUser = {
  _id?: Types.ObjectId;
  read_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  user_id: number;
  user_type: number;
  group_id: number;
  mode: object;
  communication_id?: string;
  communication_master_id: string;
  published_date?: Date;
  end_date?: Date;
  is_deleted?: number;
};

export enum EDeliveryChannelStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export type TDeliveryChannelStatus = {
  channel: string;
  delivery_status: EDeliveryChannelStatus;
  delivered_at: Date;
  failed_count: number;
};
