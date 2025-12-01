import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export type RoleCategoryMappingDocument = HydratedDocument<RoleCategoryMapping>;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})
export class RoleCategoryMapping {
  @Prop({ required: false })
  hris_unique_role_id: number;

  @Prop({ required: true })
  hris_unique_role_code: string;

  @Prop({ required: false })
  hris_unique_role: string;

  @Prop({ required: true })
  category_id: number;

  @Prop({ required: false })
  category: string;

  @Prop({ required: false, default: true })
  announcementCreate: boolean;

  @Prop({ required: false, default: true })
  announcementEdit: boolean;

  @Prop({ required: false, default: true })
  announcementView: boolean;

  @Prop({ required: false, default: true })
  masterCreate: boolean;

  @Prop({ required: false, default: true })
  masterEdit: boolean;

  @Prop({ required: false, default: true })
  masterView: boolean;

  @Prop({ required: false, default: true })
  groupCreate: boolean;

  @Prop({ required: false, default: true })
  groupEdit: boolean;

  @Prop({ required: false, default: true })
  groupView: boolean;

  @Prop({ type: Number, enum: [0, 1], default: 1, required: true })
  is_active: number;
}

export const RoleCategoryMappingSchema = SchemaFactory.createForClass(RoleCategoryMapping);
export type RoleCategoryMappingModel = Model<RoleCategoryMapping>;
