import { Types } from "mongoose"

export type TNotificationTag = {
    _id?: Types.ObjectId,
    tag_id: number,
    notification_id: Types.ObjectId,
    tag: string,
    created_at?: Date,
    updated_at?: Date
}