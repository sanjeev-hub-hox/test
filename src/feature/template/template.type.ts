import { Types } from 'mongoose';

export enum ETemplateType {
  notification = 'Notification',
  reminder = 'Reminder'
}

export enum ETemplateChannel {
  email = 'Email',
  sms = 'SMS',
  whatsapp = 'Whatsapp',
  inApp = 'In-app'
}

export type TTemplateChannelTemplateData = {
  subject?: string;
  body?: string;
  link?: string;
  variables?: string[];
};

export type TTemplateChannel = {
  channel_template_id: string;
  name: ETemplateChannel;
  template_data: TTemplateChannelTemplateData;
  is_active: boolean;
};

export type TTemplate = {
  _id?: Types.ObjectId;
  template_id?: string;
  is_default?: boolean;
  type: ETemplateType;
  slug: string;
  channels: TTemplateChannel[];
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
  __v?: number;
};
