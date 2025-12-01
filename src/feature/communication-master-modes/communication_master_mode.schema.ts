import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { CommunicationMaster } from 'feature/communication-master/schema';
import { CommunicationMode } from '../communication-modes/communication_mode.schema';
import { Document } from 'mongoose';

export type CommunicationMasterModeDocument = CommunicationMasterMode & Document;

@Schema({ timestamps: true })
export class CommunicationMasterMode {
  @Prop({ type: String, ref: 'communicationMaster', required: true })
  communication_master_id: string;

  @Prop({ type: String, ref: CommunicationMode.name, required: true })
  mode_id: string;

  @Prop({ type: String })
  subject: string;

  @Prop({ type: String })
  content: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommunicationMasterModeSchema = SchemaFactory.createForClass(CommunicationMasterMode);

CommunicationMasterModeSchema.set('toObject', { virtuals: true });
CommunicationMasterModeSchema.set('toJSON', { virtuals: true });

// Virtual population for communication mode
CommunicationMasterModeSchema.virtual('communicationMode', {
  ref: 'CommunicationMode',
  localField: 'mode_id',
  foreignField: '_id'
});
