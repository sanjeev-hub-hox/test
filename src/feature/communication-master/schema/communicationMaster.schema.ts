import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { MONGODB_COLLECTIONS } from 'ampersand-common-module';

export type CommunicationMasterDocument = HydratedDocument<CommunicationMaster>;

@Schema({ collection: 'communicationMaster' })
export class CommunicationMaster {
  communication_master_id: number;

  @Prop({ type: String })
  slug: string;

  @Prop({ required: true })
  category_id: number;

  @Prop({ default: null })
  category: string;

  @Prop({ required: true })
  sub_category_id: number;

  @Prop({ default: null })
  sub_category: string;

  // @Prop({ default: null })
  // response: string;

  @Prop({ type: Number })
  priority_id: number;

  // @Prop({ type: Number })
  // hris: number;

  // @Prop()
  // group_id: number[];

  // @Prop()
  // type: number;

  // @Prop({ default: null })
  // sub_type_id: number;

  // @Prop({ default: null })
  // sub_sub_type_id: number;

  /**
   * 1: isr
   * 2: psr
   */
  // @Prop({ default: null })
  // to_type: number;

  // @Prop({ default: null })
  // from_type: string;

  @Prop({ default: null })
  subject: string;

  // @Prop({ default: null })
  // workflow_id: number;

  // @Prop({ default: null })
  // dynamic_form_id: string;

  // @Prop({ default: null })
  // reviewer_hris: number;

  // @Prop({ default: null })
  // tat_value: number;

  // @Prop({ default: null })
  // tat_type: number;

  // @Prop({ default: null })
  // navigation_instruction: string;

  // @Prop({ default: null })
  // navigation_link: string;

  @Prop({ default: false })
  is_draft: boolean;

  @Prop({ default: Date.now() })
  created_at: Date;

  @Prop({ default: Date.now() })
  updated_at: Date;

  @Prop({ default: null })
  content: string;

  // @Prop({ default: null })
  // assignment_type: string;

  // @Prop({ default: false })
  // is_navigation_applicable: boolean;

  // @Prop({ default: false })
  // is_notification: boolean;

  // @Prop({ default: false })
  // form_slug: string;

  @Prop()
  from: number;

  @Prop()
  fromValue: string;

  @Prop()
  mode: string[];

  @Prop({ default: 0 })
  is_deleted: number;

  @Prop()
  deleted_by: string;

  @Prop()
  destination: string;

  @Prop()
  destination_id: string;

  @Prop()
  mode_id: string[];
}

export const CommunicationMasterSchema = SchemaFactory.createForClass(CommunicationMaster);
export type CommunicationMasterModel = Model<CommunicationMaster>;

CommunicationMasterSchema.set('toObject', { virtuals: true });
CommunicationMasterSchema.set('toJSON', { virtuals: true });

// Virtual population for communication logs
CommunicationMasterSchema.virtual('communication_modes', {
  ref: 'CommunicationMasterMode',
  localField: '_id',
  foreignField: 'communication_master_id'
});
