import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { Reminder, ReminderSchema } from '../reminders/schema';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { monthlyReminderSchema } from '../reminders/schema';
import { ReminderModule } from '../reminders/reminder.module';
import { model } from 'mongoose';
import { NotificationModule } from '../notification/notification.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "reminder", schema: ReminderSchema },
      { name: "monthlyReminder", schema: monthlyReminderSchema },
    ]),
    ScheduleModule.forRoot(),
    ReminderModule,
    NotificationModule
  ],
  providers: [
    CronService,
    {
        provide: getModelToken(Reminder.name),
        useValue: model,
    }
  ],
  exports: [CronService]
})
export class CronModule {}