import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Communication } from 'feature/communication/communication.schema';
import { Document, Types } from 'mongoose';

export type CommunicationAssignLogDocument = CommunicationAssignLog & Document;

@Schema({ timestamps: true })
export class CommunicationAssignLog {
  @Prop({ ref: 'Communication', required: true })
  communication_id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ type: Number })
  type_id: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommunicationAssignLogSchema = SchemaFactory.createForClass(CommunicationAssignLog);
