import { Module } from "@nestjs/common";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import {
    ReminderService
} from "./reminder.service";
import {
    Reminder,
    ReminderSchema
} from "./schema/reminder.schema";
import {
    ReminderController
} from "./reminder.controller";
import { model } from "mongoose";
import { monthlyReminderSchema } from "./schema/monthlyReminder.schema";
import { MonthlyReminderRepository, ReminderRepository } from "./repository";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: "reminder", schema: ReminderSchema },
            { name: "monthlyReminder", schema: monthlyReminderSchema },
        ]),
    ],
    providers: [
        ReminderService,
        ReminderRepository,
        MonthlyReminderRepository,
        {
            provide: getModelToken(Reminder.name),
            useValue: model,
        },
    ],
    controllers: [
        ReminderController,
    ],
    exports: [
        ReminderService, ReminderRepository, MonthlyReminderRepository
    ],
})
export class ReminderModule { }
