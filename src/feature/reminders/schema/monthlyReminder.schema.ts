import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Model, Types } from "mongoose";

export type MonthlyReminderDocument = HydratedDocument<monthlyReminder>;

@Schema({ collection: "monthlyReminders", timestamps: { createdAt: 'created_at', updatedAt: 'updated_at'} })
export class monthlyReminder {
  @Prop()
  reminder_type: string;

  @Prop()
  reminder_ref_id: Types.ObjectId;
  
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

  //true: aleady sent reminder false: need to send in reminder
  @Prop({ default: false})
  is_sent: Boolean;

  @Prop({default: false})
  is_deleted: Boolean;

}

export const monthlyReminderSchema =
  SchemaFactory.createForClass(monthlyReminder);
export type MonthlyReminderModel = Model<monthlyReminder>;