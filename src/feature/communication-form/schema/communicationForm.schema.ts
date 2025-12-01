import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

@Schema({ timestamps: true, strict: false }) // strict: false allows dynamic fields
export class CommunicationForm extends Document {
  @Prop({ required: true })
  user_id: number;

  @Prop({ required: true })
  form_id: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  communication_id: string;

  @Prop({ type: Object, required: true })
  formData: Record<string, any>;

  @Prop({ default: true })
  isSubmitted: boolean;
}

export const CommunicationFormSchema = SchemaFactory.createForClass(CommunicationForm);
export type CommunicationFormModel = Model<CommunicationForm>;
