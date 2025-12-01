import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Model, Types } from "mongoose";
export type ReminderDocument = HydratedDocument<Reminder>;

@Schema({ collection: 'reminders' , timestamps: { createdAt: 'created_at', updatedAt: 'updated_at'}})
export class Reminder {
  @Prop()
  reminder_type: string;

  @Prop()
  reminder_for: string;

  @Prop()
  reminder_for_id: Types.ObjectId;
  
  @Prop()
  is_recurring: Boolean;

  @Prop()
  recurring_frequency: string;

  @Prop()
  trigger_days: string[] | number[]
  
  @Prop()
  trigger_time: string;

  @Prop()
  start_date_time: Date;

  @Prop()
  end_date_time: Date;

  @Prop()
  added_by: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  notification : any

  @Prop({ default: true })
  is_active: Boolean;

  // true: added in monthly reminder schema not need to proceed further
  // false: need to add in monthly reminder schema
  @Prop({ default: false })
  is_moved: Boolean;

  @Prop({default: false})
  is_deleted: Boolean;
}

export const ReminderSchema =
  SchemaFactory.createForClass(Reminder);
export type ReminderModel = Model<Reminder>;