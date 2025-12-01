import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ReminderDocument, ReminderModel } from "../schema/reminder.schema";
import { TReminder } from "../reminder.type";

@Injectable()
export class ReminderRepository {
    constructor(
        @InjectModel('reminder') private reminderModel: ReminderModel,
    ) { }
    
    create(data: TReminder): Promise<ReminderDocument> {
        return this.reminderModel.create(data);
    }

    getOne(filter: Record<string, any>, projection: Record<string, number> = {}) {
        return this.reminderModel.findOne(filter, projection);
    }

    getMany(filter: Record<string, any>, projection: Record<string, number> = {}) {
        return this.reminderModel.find(filter, projection);
    }

    deleteOne(filter: Record<string, any>) {
        return this.reminderModel.deleteOne(filter);
    }

    updateMany(filter: Record<string, any>, data: Partial<TReminder>) {
        return this.reminderModel.updateMany(filter, data);
    }
}