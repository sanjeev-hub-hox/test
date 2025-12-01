import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';
import { TDeliveryChannelStatus } from '../type';

export type NotificationToUserDocument = HydratedDocument<NotificationToUser>;

@Schema({
  collection: MONGODB_COLLECTIONS.NOTIFICATION_TO_USER,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class NotificationToUser {
  // @Prop()
  // notification_id: Types.ObjectId;

  // @Prop()
  // user_id: number;

  @Prop({ default: null })
  read_at: Date;

  // @Prop({ default: null })
  // read_on_portal_id: number;

  // @Prop()
  // delivery_channel_status: TDeliveryChannelStatus[];

  // @Prop({ default: null })
  // deleted_at: Date;

  @Prop()
  user_id: number;

  @Prop()
  user_type: number;

  @Prop()
  group_id: number;

  @Prop({ type: Object })
  mode: object;

  @Prop()
  communication_id: string;

  @Prop()
  communication_master_id: string;

  @Prop()
  published_date: Date;

  @Prop()
  end_date: Date;

  @Prop()
  otherSubCategory: string;

  @Prop()
  is_deleted: number;
}

export const NotificationToUserSchema = SchemaFactory.createForClass(NotificationToUser);
export type NotificationToUserModel = Model<NotificationToUser>;
