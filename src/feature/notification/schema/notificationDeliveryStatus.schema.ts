import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';

export type NotificationDeliveryStatusDocument = HydratedDocument<NotificationDeliveryStatus>;

@Schema({
  collection: MONGODB_COLLECTIONS.NOTIFICATION_DELIVERY_STATUS
})
export class NotificationDeliveryStatus {
  @Prop()
  deliveryStatusId: number;

  @Prop()
  deliveryStatusName: string;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const NotificationDeliveryStatusSchema = SchemaFactory.createForClass(
  NotificationDeliveryStatus
);
export type NotificationDeliveryStatusModel = Model<NotificationDeliveryStatus>;
