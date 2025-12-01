import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { MonthlyReminderDocument, MonthlyReminderModel } from "../schema";
import { TMonthlyReminder } from "../reminder.type";

@Injectable()
export class MonthlyReminderRepository {
    constructor(
        @InjectModel('monthlyReminder') private monthlyReminderModel: MonthlyReminderModel,
    ) { }
    
    create(data: TMonthlyReminder): Promise<MonthlyReminderDocument> {
        return this.monthlyReminderModel.create(data);
    }

    createMany(data: TMonthlyReminder[]): Promise<MonthlyReminderDocument[]> {
        return this.monthlyReminderModel.create(data);
    }

    getOne(filter: Record<string, any>, projection: Record<string, number> = {}) {
        return this.monthlyReminderModel.findOne(filter, projection);
    }

    getMany(filter: Record<string, any>, projection: Record<string, number> = {}) {
        return this.monthlyReminderModel.find(filter, projection);
    }

    deleteMany(filter: Record<string, any>) {
        return this.monthlyReminderModel.deleteMany(filter);
    }

    updateMany(filter: Record<string, any>, data: Partial<TMonthlyReminder>) {
        return this.monthlyReminderModel.updateMany(filter, data);
    }
}