import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: MONGODB_COLLECTIONS.NOTIFICATION })
export class Notification {
  @Prop()
  notification_id: number;

  @Prop()
  short_subject: string;

  @Prop()
  subject: string;

  @Prop()
  body: string;

  @Prop({ default: null })
  link: string;

  @Prop({ default: null })
  notification_type: string;

  @Prop({ default: false })
  is_system_generated: boolean;

  @Prop({ default: false })
  is_important: boolean;

  @Prop({ required: true })
  added_by: number;

  @Prop({ default: false })
  is_to_user_visible: boolean;

  @Prop()
  generated_from_portal_id: number;

  @Prop()
  generated_to_portal_id: number;

  @Prop({ default: Date.now() })
  created_at: Date;

  @Prop({ default: Date.now() })
  updated_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
export type NotificationModel = Model<Notification>;
