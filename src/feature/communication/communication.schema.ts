import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommunicationAssignLog } from 'feature/communication-assign-log/communication-assign-log.schema';
import { CommunicationLog } from 'feature/communication-log/communication-log.schema';
import { CommunicationMaster } from 'feature/communication-master/schema';
import { CommunicationMode } from 'feature/communication-modes/communication_mode.schema';
import { Document, Types } from 'mongoose';

export type CommunicationDocument = Communication & Document;

export class attachmentObject {
  @Prop({ type: String })
  url: string;

  @Prop({ type: String })
  fileName: string;
}

@Schema({ timestamps: true })
export class Communication {
  @Prop({ ref: 'communicationMaster', required: true })
  communication_master_id: string;

  @Prop({ type: String, required: false })
  parent_id: string;

  @Prop({ type: String })
  communication: string;

  @Prop({ type: String, required: false })
  assign_to: string;

  @Prop({ type: String, required: false })
  reviewer_id: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  time: string;

  @Prop({ type: String })
  priority_id: string;

  @Prop({ type: String, required: false })
  tat: string;

  /**
   * open
   * in progress
   * resolved
   * re open
   */
  @Prop({ type: String, required: false })
  status: string;

  @Prop({ type: Boolean, required: false })
  is_published: boolean;

  @Prop({ type: String, required: true })
  created_by: string;

  @Prop({ type: Number, default: null })
  student_id: number;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: String, required: false })
  ticket_number: string;

  @Prop({ type: String, required: true })
  ticket_title: string;

  @Prop({ type: [String], required: false })
  attachment: string[];

  @Prop({ type: [attachmentObject], required: false })
  attachmentFiles: attachmentObject[];

  @Prop({ type: String, required: true })
  lobs: string;

  @Prop({ type: [Types.ObjectId], ref: CommunicationMode.name, required: true })
  mode_ids: string[];

  @Prop({ type: Boolean, required: true })
  is_response_required: boolean;

  @Prop({ type: String, required: false })
  form_slug: string;

  @Prop({ type: String, required: false, default: null })
  to_type: string;

  @Prop({ default: null })
  tat_workflow: string;

  @Prop({ default: null })
  published_date: Date;

  @Prop({ default: null })
  end_date: Date;

  @Prop({ type: [Number], required: false })
  group_id: number[];

  @Prop({ default: false })
  is_picked: boolean;

  @Prop()
  formId: string;

  @Prop()
  formSlug: string;

  @Prop()
  otherSubCategory: string;

  @Prop({ default: null })
  cc_group_id: number;

  @Prop()
  school_ids: number[];

  @Prop()
  is_deleted: number;

  @Prop()
  to?: string;

  @Prop()
  individualType?: string;

  @Prop()
  individualParents?: number[];

  @Prop()
  mode_value?: string[];

  @Prop()
  destination?: string;
}

export const CommunicationSchema = SchemaFactory.createForClass(Communication);

CommunicationSchema.set('toObject', { virtuals: true });
CommunicationSchema.set('toJSON', { virtuals: true });

// Virtual population for communication logs
CommunicationSchema.virtual('communication_logs', {
  ref: 'CommunicationLog',
  localField: '_id',
  foreignField: 'communication_id'
});

// Virtual population for communication assign logs
CommunicationSchema.virtual('communication_assign_logs', {
  ref: 'CommunicationAssignLog',
  localField: '_id',
  foreignField: 'communication_id'
});

// Virtual population for communication master
CommunicationSchema.virtual('communication_master', {
  ref: 'communicationMaster',
  localField: 'communication_master_id',
  foreignField: '_id'
});
