import { sendNotificationRequestSchema } from "../notification/dto";
import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const createReminderRequestSchema = z.object({
  reminder_type: z.string().describe('reminder type'),
  reminder_for: z.string().describe('Entity name againnst which this reminder is set'),
  reminder_for_id: z.string().describe('Id of the entity'),
  is_recurring: z.boolean().describe('Is this reminder a recurring one or not'),
  recurring_frequency: z.string().describe('Frequency of recurring reminder'),
  trigger_days: z.array(z.any()).describe('List of days or date when this reminder will be triggered, depennds on the recurring frequency'),
  trigger_time: z.string().describe('Time at which this reminder must be triggered'),
  start_date_time: z.string().describe('start date of reminder'),
  end_date_time: z.string().describe('end date of reminder'),
  added_by: z.number().describe('Id of the user who created this reminder'),
  notification: sendNotificationRequestSchema
})

export const createReminderResponseSchema = z.object({
  status: z.number().describe("status code"),
  data: z.object({
    reminderId: z.number().describe('id of reminder'),
    ReminderType: z.string().describe('reminder type'),
    isRecurring: z.boolean().describe('showning reminder is reecurring or not'),
    recurringFrequency: z.string().describe('showning Frequency is recurring or not'),
    startDateTime: z.date().describe('start date of reminder'),
    endDateTime: z.date().describe('end date of reminder'),
    subject: z.string().describe('subject of reminder'),
    body: z.string().describe('body of reminder'),
    link: z.string().describe('link of reminder'),
    isActive: z.boolean().describe('showing reminder is active or not'),
    isDeleted: z.boolean().describe('showing reminder is deleted or not'),
    createdAt: z.string().describe('time stamp at which notification is created'),
    updatedAt: z.string().describe('time stamp at which notification is updated'),
  }),
  message: z.string().describe("API response message"),
});

export const createReminderErrorSchema = z.object({
  errorCode: z.string().describe("Error code"),
  errorMessage: z.string().describe("Error message"),
});
export class CreateReminderRequest extends createZodDto(
  createReminderRequestSchema
) {}

export class CreateReminderResponse extends createZodDto(
  createReminderResponseSchema
) {}

export class CreateReminderError extends createZodDto(
  createReminderErrorSchema
) {}



