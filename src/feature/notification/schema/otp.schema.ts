import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({
  collection: 'otps',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class Otp {
  @Prop({ unique: true, required: true })
  number: number;

  @Prop()
  otp: number;

  @Prop({ default: 0 })
  sendRetryCount: number;

  @Prop({ default: 0 })
  verifyRetryCount: number;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // initial 5 min
    index: { expires: 0 } // TTL uses the exact date value
  })
  expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
export type OtpModel = Model<Otp>;
