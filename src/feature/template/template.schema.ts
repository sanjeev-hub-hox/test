import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { TTemplateChannel, ETemplateType } from './template.type';
import { getRandomId } from '../../utils';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({
  collection: 'templates'
})
export class Template {
  @Prop({ default: 'TEMP-' + getRandomId() })
  template_id: string;

  @Prop()
  name: string;

  @Prop({ default: false })
  is_default: boolean;

  @Prop()
  type: ETemplateType;

  @Prop()
  slug: string;

  @Prop()
  channels: TTemplateChannel[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: Date.now() })
  created_at: Date;

  @Prop({ default: Date.now() })
  updated_at: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
export type TemplateModel = Model<Template>;
