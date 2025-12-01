import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';

export type NotificationTagDocument = HydratedDocument<NotificationTag>;

@Schema({
  collection: MONGODB_COLLECTIONS.NOTIFICATION_TAG,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class NotificationTag {
  @Prop()
  tag_id: number;

  // future scope for ref key from notification
  @Prop()
  notification_id: Types.ObjectId;

  @Prop()
  tag: string;
}

export const NotificationTagSchema = SchemaFactory.createForClass(NotificationTag);
export type NotificationTagModel = Model<NotificationTag>;
