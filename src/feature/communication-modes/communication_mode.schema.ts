import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommunicationModeDocument = CommunicationMode & Document;

@Schema({ timestamps: true })
export class CommunicationMode {
  @Prop({ required: true })
  mode_of_communication: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommunicationModeSchema = SchemaFactory.createForClass(CommunicationMode);
