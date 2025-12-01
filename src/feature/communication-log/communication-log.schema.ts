import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Communication } from 'feature/communication/communication.schema';
import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { number } from 'zod';

export type CommunicationLogDocument = CommunicationLog & Document;

@Schema({ timestamps: true })
export class CommunicationLog {
  @Prop({ ref: Communication.name, required: true })
  communication_id: string;

  @Prop({ required: true })
  comment: string;

  @Prop()
  attachment_details: string;

  @Prop({ type: String })
  user_type: string;

  @Prop({ type: String, required: true })
  user_id: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Number })
  rating: number;

  @Prop({ default: false })
  is_draft: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommunicationLogSchema = SchemaFactory.createForClass(CommunicationLog);
