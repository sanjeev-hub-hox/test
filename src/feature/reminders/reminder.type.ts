import { Types } from "mongoose"

export type TReminderNotificationTemplate = {
    template_slug: string,
    user_ids: number[],
    channels: any[],
    generated_from_portal_id: number,
    generated_to_portal_id: number
}


export type TReminderNotificationEmailChannel = {
    name: string,
    variables: {
        name: string,
        value: any
    }[]
}

export type TReminderNotificationInAppChannel = {
    name: string,
    subject: string,
    body: string,
    link: string,
    shortSubject?: string
}

export type TReminder = {
    _id?: Types.ObjectId,
    reminder_type: string,
    reminder_for: string,
    reminder_for_id: Types.ObjectId,
    is_recurring: boolean,
    recurring_frequency: string,
    trigger_days: string[] | number[],
    trigger_time: string,
    start_date_time: Date,
    end_date_time: Date,
    added_by: number,
    notification: any,
    is_active?: boolean,
    is_moved?: boolean;
    is_deleted?: boolean;
}

export type TMonthlyReminder = {
    reminder_type: string,
    reminder_ref_id: Types.ObjectId,
    reminder_for: string,
    reminder_for_id: Types.ObjectId,
    is_recurring: boolean,
    recurring_frequency: string,
    trigger_days: string[] | number[],
    trigger_time: string,
    start_date_time: Date,
    end_date_time: Date,
    added_by: number,
    notification: any,
    is_active?: boolean,
    is_sent?: boolean;
    is_deleted?: boolean;
}