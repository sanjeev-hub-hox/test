import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';

export type NotificationTypeDocument = HydratedDocument<NotificationType>;

@Schema({ collection: MONGODB_COLLECTIONS.NOTIFICATION_TYPE })
export class NotificationType {
  @Prop()
  typeId: number;

  @Prop()
  name: string;

  @Prop()
  color: string;

  @Prop()
  icon: string;

  @Prop()
  isActive: Boolean;

  @Prop()
  orderNo: number;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const NotificationTypeSchema = SchemaFactory.createForClass(NotificationType);
export type NotificationTypeModel = Model<NotificationType>;
