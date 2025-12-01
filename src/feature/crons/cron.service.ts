import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import moment from 'moment';
import { MonthlyReminderRepository, ReminderRepository } from '../reminders/repository';
import { TReminder } from '../reminders/reminder.type';
import { LoggerService } from '../../utils';
import { NotificationService } from '../notification/service';

@Injectable()
export class CronService {
  constructor(
    private monthlyReminderRepository: MonthlyReminderRepository,
    private reminderRepository: ReminderRepository,
    private notificationService: NotificationService,
    private loggerService: LoggerService
  ) {}
  @Cron('10 0 * * *', { name: 'dailyMoveReminderCron', timeZone: 'Asia/Kolkata' })
  async dailyMoveReminderCron() {
    try {
      const today = moment();
      const oneMonthAgo = today.subtract(1, 'months');
      this.loggerService.log(
        `Daily cron to move the reminders to monthly reminders called at 00:10 AM : ${today}`
      );
      const reminders: any = await this.reminderRepository.getMany({
        created_at: { $gte: oneMonthAgo },
        is_moved: false,
        is_active: true,
        is_deleted: false
      });
      if (reminders.length > 0) {
        const reminderIds = reminders.map((reminder) => reminder._id);
        this.loggerService.log(`Found reminders that are to be moved`);
        this.loggerService.log(`Reminders that are to be moved : ${JSON.stringify(reminderIds)}`);
        const monthlyReminderPromises = [];
        for (const reminder of reminders) {
          monthlyReminderPromises.push(
            this.monthlyReminderRepository.create({ ...reminder, reminder_ref_id: reminder._id })
          );
        }
        await Promise.all(monthlyReminderPromises);

        await this.reminderRepository.updateMany({ _id: { $in: reminderIds } }, { is_moved: true });

        this.loggerService.log(
          `Reminders that marked as is_moved = true : ${JSON.stringify(reminderIds)}`
        );
        return;
      }
      this.loggerService.log('No reminders found that are to be moved');
      return;
    } catch (error) {
      throw error;
    }
  }

  @Cron('* * * * *', { name: 'everyMinuteTriggerReminderCron', timeZone: 'Asia/Kolkata' })
  async everyMinuteTriggerReminderCron() {
    try {
      const date = moment();
      this.loggerService.log(`Cron to trigger the reminders called at : ${date}`);
      const data: any = await this.monthlyReminderRepository.getMany({
        $or: [
          {
            //this first $and condition should not exist but kept it for safer side
            $and: [{ is_recurring: true }, { is_sent: true }]
          },
          {
            $and: [{ is_recurring: true }, { is_sent: false }]
          },
          {
            $and: [{ is_recurring: false }, { is_sent: false }]
          }
        ]
      });

      const triggerReminders = this.getTriggerReminders(data);
      if (!triggerReminders.length) {
        this.loggerService.log('No reminders found which can be triggered');
        return;
      }

      const triggerReminderIds = triggerReminders.map((reminder) => reminder._id);

      this.loggerService.log(`Reminders to be triggered : ${triggerReminderIds}`);

      // TODO Reminders should be marked as true only after the reminders are triggered
      await this.monthlyReminderRepository.updateMany(
        { _id: { $in: triggerReminderIds } },
        { is_sent: true }
      );

      for (const reminder of triggerReminders) {
        if (reminder?.notification && Object.keys(reminder?.notification).length) {
          const {
            user_ids,
            channels,
            generated_from_portal_id,
            generated_to_portal_id,
            added_by,
            ...notificationDetails
          } = reminder.notification;
          const payload = {
            userIds: user_ids,
            channels,
            generated_from_portal_id,
            generated_to_portal_id,
            added_by,
            ...notificationDetails
          };
          await this.notificationService.sendNotification(payload);
        }
      }

      this.loggerService.log('Reminder found which can be triggered');
      return;
    } catch (error) {
      throw error;
    }
  }

  @Cron('1 0 * * *', { name: 'dailyDeleteExpiredReminderCron', timeZone: 'Asia/Kolkata' })
  async dailyDeleteExpiredReminderCron() {
    try {
      const today = moment();
      const startOfYesterday = today.clone().subtract(1, 'day').startOf('day');
      const endOfYesterday = today.clone().subtract(1, 'day').endOf('day');
      this.loggerService.log(`Cron to delete expired reminders called at 00:01 AM, ${today}`);
      const monthlyReminders = await this.monthlyReminderRepository.getMany({
        $and: [
          {
            end_date_time: {
              $gte: startOfYesterday
            }
          },
          {
            end_date_time: {
              $lte: endOfYesterday
            }
          }
        ]
      });

      if (monthlyReminders.length) {
        this.loggerService.log('Monthly reminders found that are to be deleted');

        const monthlyReminderReferenceIds = monthlyReminders.map(
          (reminder) => reminder.reminder_ref_id
        );
        this.loggerService.log(`Mothly reminders to be deleted : ${monthlyReminders}`);
        await this.monthlyReminderRepository.deleteMany({
          _id: {
            $in: monthlyReminders.map((reminder) => reminder._id)
          }
        });

        await this.reminderRepository.updateMany(
          { _id: { $in: monthlyReminderReferenceIds } },
          { is_active: false }
        );

        this.loggerService.log(`Reminders to be deactivated : ${monthlyReminderReferenceIds}`);
        return;
      }
      this.loggerService.log('No monthly reminders found that are to be deleted');
      return;
    } catch (error) {
      throw error;
    }
  }

  @Cron('5 0 * * *', { name: 'dailyResetReminderCron', timeZone: 'Asia/Kolkata' })
  async dailyResetReminderCron() {
    try {
      const today = moment();
      this.loggerService.log(`Cron to reset reminders called at 00:05 AM, ${today}`);
      const remindersToBeTriggered: any = await this.monthlyReminderRepository.getMany({
        is_sent: true,
        is_active: true,
        end_date_time: {
          $gte: today.endOf('day')
        }
      });
      if (remindersToBeTriggered.length) {
        const reminderIdsToBeTriggered = remindersToBeTriggered.map((reminder) => reminder._id);
        this.loggerService.log(`Triggers found that are to be reset`);
        this.loggerService.log(`Triggers to be reset: ${reminderIdsToBeTriggered}`);

        await this.monthlyReminderRepository.updateMany(
          {
            _id: { $in: reminderIdsToBeTriggered }
          },
          { is_sent: false }
        );
      }
      return;
    } catch (err) {
      throw err;
    }
  }

  getTriggerReminders(reminders: TReminder[]): TReminder[] {
    const triggerReminders = [];
    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const currentWeekDay = new Date().getDay() + 1;
    const currentMonthDay = new Date().getDate();
    const currentMonth = new Date().getMonth() + 1;

    for (const reminder of reminders) {
      const { recurring_frequency, trigger_days, trigger_time } = reminder;
      switch (recurring_frequency) {
        case 'daily':
          const [triggerHour, triggerMinutes, triggerSeconds] = trigger_time.split(':');
          if (currentHour === +triggerHour && currentMinutes === +triggerMinutes) {
            triggerReminders.push(reminder);
          }
          break;
        case 'weekly':
        case 'bi-weekly':
          if (
            (trigger_days as number[]).includes(+currentWeekDay) &&
            currentHour === +triggerHour &&
            currentMinutes === +triggerMinutes
          ) {
            triggerReminders.push(reminder);
          }
          break;
        case 'monthly':
          if (
            (trigger_days as number[]).includes(currentMonthDay) &&
            currentHour === +triggerHour &&
            currentMinutes === +triggerMinutes
          ) {
            triggerReminders.push(reminder);
          }
          break;
        case 'yearly':
          if ((trigger_days as string[]).includes(`${currentMonthDay}/${currentMonth}`)) {
            triggerReminders.push(reminder);
          }
          break;
      }
    }
    return triggerReminders;
  }

  @Cron('*/5 * * * *', {
    name: 'afterEveryFiveMinutesRetryNotificationTrigger',
    timeZone: 'Asia/Kolkata'
  })
  async triggerPendingOrFailedNotifications() {
    try {
      this.loggerService.log(
        'Cron to retrigger pending and failed notifications triggered at:',
        moment()
      );
      await this.notificationService.getPendingAndFailedNotifications();
      return;
    } catch (err: Error | unknown) {
      throw err;
    }
  }
}
