import { Types } from 'mongoose';

export type TNotification = {
  _id?: Types.ObjectId;
  notification_id: number;
  short_subject?: string;
  subject?: string;
  body?: string;
  link?: string;
  notification_type?: string;
  is_system_generated?: boolean;
  is_important?: boolean;
  added_by?: number;
  is_to_user_visible?: boolean;
  generated_from_portal_id?: number;
  generated_to_portal_id?: number;
  created_at?: Date;
  updated_at?: Date;
};
