import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';
import { ENotificationChannelStatus } from '../type';

export type NotificationChannelDocument = HydratedDocument<NotificationChannel>;

@Schema({
  collection: MONGODB_COLLECTIONS.NOTIFICATION_CHANNEL,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class NotificationChannel {
  @Prop()
  channel: string;

  @Prop()
  notification_id: Types.ObjectId;

  @Prop({ default: null })
  template_id: Types.ObjectId;

  @Prop()
  status: ENotificationChannelStatus;
}

export const NotificationChannelSchema = SchemaFactory.createForClass(NotificationChannel);
export type NotificationChannelModel = Model<NotificationChannel>;
