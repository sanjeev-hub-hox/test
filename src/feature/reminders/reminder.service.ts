import {  ReminderDocument } from "./schema/reminder.schema";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CRON_TIME } from "../../utils/constant"
import { TReminder } from "./reminder.type";
import { MonthlyReminderRepository, ReminderRepository } from "./repository";
import { getSeconds } from './reminder.helper';

@Injectable()
export class ReminderService {
  constructor(
    private reminderRepository: ReminderRepository,
    private monthlyReminderRepository: MonthlyReminderRepository
  ) {}

  async create(createData: TReminder): Promise<ReminderDocument> {
    const currentWeekDay = new Date().getDay() + 1;
    const currentMonthDay = new Date().getDate();
    const currentMonth = new Date().getMonth() + 1;
    
    const { recurring_frequency, trigger_days, trigger_time } = createData;

    let moveToMonthlyReminders = false;
    const isTriggerTimePassed = getSeconds(trigger_time) > getSeconds(CRON_TIME);

    switch (recurring_frequency) {
      case "daily":
        if (getSeconds(trigger_time) > getSeconds(CRON_TIME)) {
          moveToMonthlyReminders = true;
        }
        break;
      case "weekly":
      case "bi-weekly":
        const isTodayWeeklyTiggerDay = (trigger_days as number[]).includes(+currentWeekDay);
        if (isTodayWeeklyTiggerDay && !isTriggerTimePassed) {
          moveToMonthlyReminders = true;
        }
        break;
      case "monthly":
        const isTodayMonthlyTiggerDay = (trigger_days as number[]).includes(+currentMonthDay);
        if (isTodayMonthlyTiggerDay && !isTriggerTimePassed) {
          moveToMonthlyReminders = true;
        }
        break;
      case "yearly":
        const isTodayYearlyTriggerDay = (trigger_days as string[]).includes(`${currentMonthDay}/${currentMonth}`);
        if (isTodayYearlyTriggerDay && !isTriggerTimePassed) {
          moveToMonthlyReminders = true;
        }
        break;
    }
    if(moveToMonthlyReminders) {
      const reminder = await this.reminderRepository.create({ ...createData, is_moved: true});

      if (!reminder) {
        throw new HttpException('Something went wrong while creating reminder', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const monthlyReminder = await this.monthlyReminderRepository.create({
        ...createData,
        reminder_ref_id: reminder._id,
      })

      if (!monthlyReminder) {
        await this.reminderRepository.deleteOne({_id: reminder._id})
        throw new HttpException('Something went wrong while creating reminder', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return reminder;
    } else {
      const reminder = await this.reminderRepository.create(createData);
      return reminder;
    }
  }
}
