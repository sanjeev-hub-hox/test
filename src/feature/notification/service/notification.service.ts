import { NotificationDocument } from '../schema';
import { CreateNotificationRequest, SendNotificationRequest } from '../dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import {
  NotificationChannelRepository,
  NotificationTagRepository,
  NotificationToUserRepository,
  NotificationRepository,
  OtpRepository
} from '../repository';
import { populateTemplateVariables, validateAndPopulateTemplate } from '../helper';
import {
  EMPLOYEE_DETAILS,
  USER_DETAILS,
  STUDENT_USER_DETAILS,
  EMAIL_CONFIG,
  LoggerService,
  PORTALS,
  RETRY_THRESHOLD,
  SEND_NOTIFICATION_CHANNELS_WITHOUT_TEMPLATE_SLUG,
  getRandomId,
  TICKET_TOKEN,
  ACADEMICS_WORKLOAD,
  AC_STUDENTS,
  SIBLING_LIST,
  MDM_URL
} from '../../../utils';
import { EDeliveryChannelStatus, ENotificationChannelStatus, TNotification } from '../type';
import { TemplateRepository } from '../../template/template.repository';
import { TemplateDocument } from '../../template/template.schema';
import { CommunicationMasterModeRepository } from '../../communication-master-modes/communication_master_mode.repository';
import { MessageService } from './sms';
import { MailService } from '../../../utils/mailer';
import { FirebaseService } from '../../../utils/firebase';
import { StorageService, GoogleCloudStorageService, EStorageType } from 'ampersand-common-module';
import { CommunicationModeService } from '../../communication-modes/communication_mode.service';
import { CommunicationMasterService } from '../../communication-master/service';
import { GoogleCloudStorageConfigService } from '../../../utils/gcsSetup';
import { NotificationToUserService } from '../service/notificationToUser.service';
import axios from 'axios';
import * as qs from 'qs';
import { generateOtp } from '../helper/otp';

const hasCommonNumber = (arr1, arr2) => {
  const [small, large] = arr1.length < arr2.length ? [arr1, arr2] : [arr2, arr1];
  const set = new Set(small);
  console.log(large.some((num) => set.has(num)));
  return large.some((num) => set.has(num));
};

@Injectable()
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationToUserRepository: NotificationToUserRepository,
    private notificationTagRepository: NotificationTagRepository,
    private notificationChannelRepository: NotificationChannelRepository,
    private templateRepository: TemplateRepository,
    private loggerService: LoggerService,
    private communicationMasterModeRepository: CommunicationMasterModeRepository,
    private readonly mailService: MailService,
    private readonly messageService: MessageService,
    private readonly firebaseService: FirebaseService,
    private storageService: StorageService,
    private googleCloudStorageService: GoogleCloudStorageService,
    private communicationMasterService: CommunicationMasterService,
    private communicationModeService: CommunicationModeService,
    private notificationToUserService: NotificationToUserService,
    private otpRepository: OtpRepository
  ) {}

  create(createData: TNotification): Promise<NotificationDocument> {
    return this.notificationRepository.create(createData);
  }

  getNotificationCountByPortals(): Promise<any> {
    return this.notificationRepository.aggregate([
      {
        $group: {
          _id: '$generated_to_portal_id',
          count: {
            $sum: 1
          }
        }
      }
    ]);
  }

  async createNotification(
    notificationDataBody: CreateNotificationRequest & {
      template: { subject: string; body: string };
    }
  ) {
    const { userIds, channels, template, ...notificationDetails } = notificationDataBody;
    const notificationData = {
      notification_id: getRandomId(),
      notification_type: notificationDetails.type,
      short_subject: notificationDetails.slug ? template.subject : notificationDetails.subject,
      subject: notificationDetails.slug ? template.subject : notificationDetails.subject,
      body: notificationDetails.slug ? template.body : notificationDetails.body,
      ...(notificationDetails?.link ? { link: notificationDetails?.link } : {}),
      ...(notificationDetails?.isSystemGenerated
        ? { is_system_generated: notificationDetails?.isSystemGenerated }
        : {}),
      ...(notificationDetails?.isImportant
        ? { is_important: notificationDetails?.isImportant }
        : {}),
      ...(notificationDetails?.addedBy ? { added_by: notificationDetails?.addedBy } : {}),
      ...(notificationDetails?.isToUserVisible
        ? { is_to_user_visible: notificationDetails?.isToUserVisible }
        : {}),
      generated_from_portal_id: notificationDetails.generatedFromPortalId,
      generated_to_portal_id: notificationDetails.generatedToPortalId
    };
    const notification = await this.create(notificationData);

    if (notificationDetails.tags) {
      const createTagPromises = [];
      for (const tag of notificationDetails.tags) {
        createTagPromises.push(
          this.notificationTagRepository.create({
            tag_id: getRandomId(),
            notification_id: notification._id,
            tag: tag
          })
        );
      }
      await Promise.all(createTagPromises);
    }

    const notificationChannelMapPromises = [];
    for (const channel of channels) {
      notificationChannelMapPromises.push(
        this.notificationChannelRepository.create({
          channel: channel.channel,
          notification_id: notification._id,
          status: ENotificationChannelStatus.Success // TODO This status will depend on send notification response
        })
      );
    }

    await Promise.all(notificationChannelMapPromises);

    const notificationToUserMapPromises = [];
    // for (const userId of userIds) {
    //   notificationToUserMapPromises.push(
    //     this.notificationToUserRepository.create({
    //       notification_id: notification._id,
    //       user_id: userId,
    //       delivery_channel_status: channels.map(
    //         (channel: {
    //           channel: string;
    //           deliveryStatus?: EDeliveryChannelStatus;
    //           deliveredAt?: Date;
    //         }) => ({
    //           channel: channel.channel,
    //           delivery_status: channel.deliveryStatus,
    //           delivered_at: channel?.deliveredAt ?? new Date(),
    //           failed_count: 0
    //         })
    //       )
    //     })
    //   );
    // }

    await Promise.all(notificationToUserMapPromises);
  }

  async getReadCount(portalId: number, userId: number) {
    const countResult = await this.notificationToUserRepository.aggregate([
      {
        $match: {
          user_id: userId,
          deleted_at: null
        }
      },
      {
        $lookup: {
          from: 'notification',
          localField: 'notification_id',
          foreignField: '_id',
          as: 'notification_details',
          pipeline: [
            {
              $match: {
                generated_to_portal_id: portalId
              }
            }
          ]
        }
      },
      {
        $group: {
          _id: {
            readAtNull: {
              $cond: [
                {
                  $eq: ['$read_at', null]
                },
                true,
                false
              ]
            }
          },
          count: {
            $sum: 1
          }
        }
      }
    ]);

    if (!countResult?.length) {
      return {
        read: 0,
        unread: 0,
        all: 0
      };
    }

    const readCount = countResult.find((el) => !el._id.readAtNull)?.count ?? 0;
    const unreadCount = countResult.find((el) => el._id.readAtNull)?.count ?? 0;

    return {
      read: readCount,
      unread: unreadCount,
      all: readCount + unreadCount
    };
  }

  async checkTemplateExistence(templateSlug: string): Promise<TemplateDocument> {
    const templateData = await this.templateRepository.getOne({
      slug: templateSlug,
      is_active: true,
      is_deleted: false
    });

    if (!templateData) {
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }

    return templateData;
  }

  // Validation and publisher function
  // async sendNotification(reqBody: SendNotificationRequest) {
  async sendNotification(reqBody: { [key: string]: any }) {
    let modes = {};
    if (
      reqBody.communicationMaster.communication_modes &&
      reqBody.communicationMaster.communication_modes.length > 0
    ) {
      for (const element of reqBody.communicationMaster.communication_modes) {
        let temp = await this.communicationModeService.findOne(element.mode_id);
        if (temp != null) {
          modes[temp.mode_of_communication] = String(temp['_id']);
        }
      }
    } else {
      this.loggerService.log('there is no communication mode');
      return true;
    }

    let mailTo: string[] = [];
    let mail: { [key: string]: string } = {};
    let text: string = '';
    if (modes['email'] !== undefined) {
      const communication_modes = reqBody.communicationMaster.communication_modes.find(
        (object) => object.mode_id == modes['email']
      );

      if (reqBody.to_mail != undefined && reqBody.to_mail.length > 0) {
        mailTo = reqBody.to_mail;
      }

      text = communication_modes.subject;
      for (const key in reqBody.param) {
        text = text.replace(`{{${key}}}`, reqBody.param[key]);
      }
      mail['subject'] = text;

      text = communication_modes.content;
      for (const key in reqBody.param) {
        text = text.replace(`{{${key}}}`, reqBody.param[key]);
      }
      mail['body'] = text;
    }

    let pushMsg: { [key: string]: string } = {};
    let appToken: string[] = [];
    if (modes['push'] !== undefined) {
      const communication_modes = reqBody.communicationMaster.communication_modes.find(
        (object) => object.mode_id == modes['push']
      );

      if (reqBody.to_mail != undefined && reqBody.to_mail.length > 0) {
        mailTo = reqBody.to_mail;
      }

      text = communication_modes.subject;
      for (const key in reqBody.param) {
        text = text.replace(`{{${key}}}`, reqBody.param[key]);
      }
      pushMsg['subject'] = text;

      text = communication_modes.content;
      for (const key in reqBody.param) {
        text = text.replace(`{{${key}}}`, reqBody.param[key]);
      }
      pushMsg['body'] = text;
    }

    let smsTo: string[] = [];
    let message: string;
    let whatsapp: { [key: string]: string } = {};
    if (modes['sms'] !== undefined || modes['whatsapp'] !== undefined) {
      if (reqBody.to_mobile != undefined && reqBody.to_mobile.length > 0) {
        smsTo = reqBody.to_mobile;
      }

      if (modes['sms'] !== undefined) {
        const communication_modes = reqBody.communicationMaster.communication_modes.find(
          (object) => object.mode_id == modes['sms']
        );
        text = communication_modes.content;
        for (const key in reqBody.param) {
          text.replace(`{{${key}}}`, reqBody.param[key]);
        }
        message = text;
      }

      if (modes['whatsapp'] !== undefined) {
        const communication_modes = reqBody.communicationMaster.communication_modes.find(
          (object) => object.mode_id == modes['whatsapp']
        );
        text = communication_modes.subject;
        for (const key in reqBody.param) {
          text = text.replace(`{{${key}}}`, reqBody.param[key]);
        }
        whatsapp['subject'] = text;

        text = communication_modes.content;
        for (const key in reqBody.param) {
          text = text.replace(`{{${key}}}`, reqBody.param[key]);
        }
        whatsapp['body'] = text;
      }
    }

    if (modes['in_app'] !== undefined) {
      const communication_modes = reqBody.communicationMaster.communication_modes.find(
        (object) => object.mode_id == modes['in_app']
      );

      let employeeIds = await this.communicationMasterService.getEmployees(
        reqBody.communicationMaster.group_id
      );

      let subject = communication_modes.subject;
      let content = communication_modes.content;
      for (const key in reqBody.param) {
        subject = subject.replace(`{{${key}}}`, reqBody.param[key]);
        content = content.replace(`{{${key}}}`, reqBody.param[key]);
      }
      let mode = {
        [modes['in_app']]: {
          subject: subject,
          content: content
        }
      };

      let data = [];
      for (const groupId in employeeIds) {
        for (const key in employeeIds[groupId]) {
          for (const element of employeeIds[groupId][key]) {
            let temp = {
              user_id: element,
              user_type: key == 'employee_id' ? 1 : 2,
              group_id: groupId,
              mode: mode,
              communication_master_id: String(reqBody.communicationMaster._id)
            };

            if (
              reqBody.communication_id !== undefined &&
              reqBody.communication_id !== null &&
              reqBody.communication_id !== ''
            ) {
              temp['communication_id'] = reqBody.communication_id;
            }
            data.push(temp);
          }
        }
      }

      if (data.length > 0) {
        await this.notificationToUserService.createMany(data);
      }
    }

    if (reqBody.employee_ids == undefined || reqBody.employee_ids.length == 0) {
      reqBody.employee_ids = [];
    }
    if (reqBody.global_ids == undefined || reqBody.global_ids.length == 0) {
      reqBody.global_ids = [];
    }
    if (reqBody.global_nos == undefined || reqBody.global_nos.length == 0) {
      reqBody.global_nos = [];
    }
    if (reqBody.student_ids == undefined || reqBody.student_ids.length == 0) {
      reqBody.student_ids = [];
    }

    let employee = [];
    let user = [];
    let user_no = [];
    let student_user = [];
    [employee, user, user_no, student_user] = await Promise.all([
      this.communicationMasterService.getMdmDataByIds(reqBody.employee_ids, EMPLOYEE_DETAILS),
      this.communicationMasterService.getMdmDataByIds(reqBody.global_ids, USER_DETAILS),
      this.communicationMasterService.getMdmDataByColumn(
        'global_number',
        reqBody.global_nos,
        USER_DETAILS
      ),
      this.communicationMasterService.getMdmDataByStudentId(
        reqBody.student_ids,
        STUDENT_USER_DETAILS
      )
    ]);

    user = [...user, ...user_no];
    for (const element of employee) {
      if (
        element.attributes.Official_Email_ID != null &&
        !mailTo.includes(element.attributes.Official_Email_ID)
      ) {
        mailTo.push(element.attributes.Official_Email_ID);
      }
      if (element.attributes.Mobile != null && !smsTo.includes(element.attributes.Mobile)) {
        smsTo.push(element.attributes.Mobile);
      }
    }
    for (const element of user) {
      if (element.attributes.email != null && !mailTo.includes(element.attributes.email)) {
        mailTo.push(element.attributes.email);
      }
      if (element.attributes.mobile_no != null && !smsTo.includes(element.attributes.mobile_no)) {
        smsTo.push(element.attributes.mobile_no);
      }
      if (
        element.attributes.app_token != null &&
        !appToken.includes(element.attributes.app_token)
      ) {
        appToken.push(element.attributes.app_token);
      }
    }
    for (const element of user_no) {
      if (element.attributes.email != null && !mailTo.includes(element.attributes.email)) {
        mailTo.push(element.attributes.email);
      }
      if (element.attributes.mobile_no != null && !smsTo.includes(element.attributes.mobile_no)) {
        smsTo.push(element.attributes.mobile_no);
      }
      if (
        element.attributes.app_token != null &&
        !appToken.includes(element.attributes.app_token)
      ) {
        appToken.push(element.attributes.app_token);
      }
    }
    for (const element of student_user) {
      if (element.email != null && !mailTo.includes(element.email)) {
        mailTo.push(element.email);
      }
      if (element.mobile_no != null && !smsTo.includes(element.mobile_no)) {
        smsTo.push(element.mobile_no);
      }
      if (element.app_token != null && !appToken.includes(element.app_token)) {
        appToken.push(element.app_token);
      }
    }

    this.loggerService.log(`Mail To: ${mailTo}`);
    let response = {
      slug: reqBody.communicationMaster.slug,
      param: reqBody.param,
      modes: Object.keys(modes),
      mailTo,
      mail,
      pushMsg,
      appToken,
      smsTo,
      message,
      whatsapp,
      attachment: reqBody.attachment
    };

    await this.sendCommunicationNotification(response, reqBody);
    return true;
  }

  // NOTE : There will be no. of channel times sucscriber function
  // In-app channel subscriber
  async subscribeInAppNotification(payload: any) {
    const { notificationId, channel, userId } = payload;
    try {
      // Check if notification user mapping exists
      const notificationUserMapping = await this.notificationToUserRepository.getOne({
        notification_id: notificationId,
        user_id: userId
      });

      // Execute the below if block for non retry process
      if (payload.retry === undefined) {
        if (notificationUserMapping) {
          // update mapping when notification user mapping exists
          await this.notificationToUserRepository.updateById(notificationUserMapping._id, {
            $push: {
              delivery_channel_status: {
                channel: channel,
                delivery_status: EDeliveryChannelStatus.PENDING,
                delivered_at: new Date(),
                failed_count: 0
              }
            }
          });
        } else {
          // Create notification user mapping
          // await this.notificationToUserRepository.create({
          //   notification_id: notificationId,
          //   user_id: userId,
          //   delivery_channel_status: [
          //     {
          //       channel: channel,
          //       delivery_status: EDeliveryChannelStatus.PENDING,
          //       delivered_at: new Date(),
          //       failed_count: 0
          //     }
          //   ]
          // });
        }
      }

      // TODO - actual sending functionality for in-app notification will come here
      // Currently mocking it
      const sendResponse = (payload: any) => true;

      // TODO - Handle status properly when actual send functionality is implemented and map the status accordingly in DB
      let failedCount = 0;
      let isFailed = false;
      if (!sendResponse({})) {
        isFailed = true;
        failedCount++;
      }

      let updateIndex = -1;
      // notificationUserMapping.delivery_channel_status.forEach((channelStatus, index) => {
      //   if (channelStatus.channel === channel) {
      //     updateIndex = index;
      //   }
      // });

      // if (updateIndex !== -1) {
      //   // update mapping
      //   const updateField = `delivery_channel_status.${updateIndex}.delivery_status`;
      //   await this.notificationToUserRepository.updateOne(
      //     { _id: notificationUserMapping._id },
      //     {
      //       $set: {
      //         [updateField]: !isFailed
      //           ? EDeliveryChannelStatus.SUCCESS
      //           : EDeliveryChannelStatus.FAILED,
      //         failed_count: failedCount,
      //         delivered_at: !isFailed
      //           ? new Date()
      //           : notificationUserMapping.delivery_channel_status[updateIndex].delivered_at
      //       }
      //     }
      //   );
      // }

      this.loggerService.log(
        `In-app notification sent successfully to user - ${userId}, notificationId - ${notificationId}`
      );
      return true;
    } catch (err) {
      this.loggerService.error(
        `Error occured while sending in-app notification to user - ${userId}, notificationId - ${notificationId}`,
        null
      );
      this.loggerService.error(`Error: ${err}`);
      return false;
    }
  }

  // Email channel subscriber
  async subscribeEmailNotification(payload: any) {
    const { notificationId, channel, userId } = payload;
    try {
      // Check if notification user mapping exists
      const notificationUserMapping = await this.notificationToUserRepository.getOne({
        notification_id: notificationId,
        user_id: userId
      });

      if (payload.retry === undefined) {
        // if (notificationUserMapping) {
        //   // update mapping when notification user mapping exists
        //   await this.notificationToUserRepository.updateById(notificationUserMapping._id, {
        //     $push: {
        //       delivery_channel_status: {
        //         channel: channel,
        //         delivery_status: EDeliveryChannelStatus.PENDING,
        //         delivered_at: new Date(),
        //         failed_count: 0
        //       }
        //     }
        //   });
        // } else {
        //   // Create notification user mapping
        //   const mapping = await this.notificationToUserRepository.create({
        //     notification_id: notificationId,
        //     user_id: userId,
        //     delivery_channel_status: [
        //       {
        //         channel: channel,
        //         delivery_status: EDeliveryChannelStatus.PENDING,
        //         delivered_at: new Date(),
        //         failed_count: 0
        //       }
        //     ]
        //   });
        // }
      }
      // TODO - actual sending functionality for email notification will come here
      // Currently mocking the sending functionality
      const sendResponse = (payload: any) => true;

      // TODO - Handle status properly when actual send functionality is implemented and map the status accordingly in DB
      let failedCount = 0;
      let isFailed = false;
      if (!sendResponse({})) {
        isFailed = true;
        failedCount++;
      }

      let updateIndex = -1;
      // notificationUserMapping.delivery_channel_status.forEach((channelStatus, index) => {
      //   if (channelStatus.channel === channel) {
      //     updateIndex = index;
      //   }
      // });

      // if (updateIndex !== -1) {
      //   // update mapping status and failed count
      //   const updateField = `delivery_channel_status.${updateIndex}.delivery_status`;
      //   await this.notificationToUserRepository.updateOne(
      //     { _id: notificationUserMapping._id },
      //     {
      //       $set: {
      //         [updateField]: !isFailed
      //           ? EDeliveryChannelStatus.SUCCESS
      //           : EDeliveryChannelStatus.FAILED,
      //         failed_count: failedCount,
      //         delivered_at: !isFailed
      //           ? new Date()
      //           : notificationUserMapping.delivery_channel_status[updateIndex].delivered_at
      //       }
      //     }
      //   );
      // }

      this.loggerService.log(
        `Email notification sent successfully to user - ${userId}, notificationId - ${notificationId}`
      );
      return true;
    } catch (err) {
      this.loggerService.error(
        `Error occured while sending email notification to user - ${userId}, notificationId - ${notificationId}`,
        null
      );
      this.loggerService.error(`Error: ${err}`);
      return false;
    }
  }

  // SMS channel subscriber
  async subscribeSMSNotification(payload: any) {
    const { notificationId, channel, userId } = payload;
    try {
      // Check if notification user mapping exists
      const notificationUserMapping = await this.notificationToUserRepository.getOne({
        notification_id: notificationId,
        user_id: userId
      });

      if (payload.retry === undefined) {
        if (notificationUserMapping) {
          // update mapping when notification user mapping exists
          await this.notificationToUserRepository.updateById(notificationUserMapping._id, {
            $push: {
              delivery_channel_status: {
                channel: channel,
                delivery_status: EDeliveryChannelStatus.PENDING,
                delivered_at: new Date(),
                failed_count: 0
              }
            }
          });
        } else {
          // Create notification user mapping
          // const mapping = await this.notificationToUserRepository.create({
          //   notification_id: notificationId,
          //   user_id: userId,
          //   delivery_channel_status: [
          //     {
          //       channel: channel,
          //       delivery_status: EDeliveryChannelStatus.PENDING,
          //       delivered_at: new Date(),
          //       failed_count: 0
          //     }
          //   ]
          // });
        }
      }
      // TODO - actual sending functionality for SMS notification will come here
      // Currently mocking the sending functionality
      const sendResponse = (payload: any) => true;

      // TODO - Handle status properly when actual send functionality is implemented and map the status accordingly in DB
      let failedCount = 0;
      let isFailed = false;
      if (!sendResponse({})) {
        isFailed = true;
        failedCount++;
      }

      let updateIndex = -1;
      // notificationUserMapping.delivery_channel_status.forEach((channelStatus, index) => {
      //   if (channelStatus.channel === channel) {
      //     updateIndex = index;
      //   }
      // });

      // if (updateIndex !== -1) {
      //   // update mapping
      //   const updateField = `delivery_channel_status.${updateIndex}.delivery_status`;
      //   await this.notificationToUserRepository.updateOne(
      //     { _id: notificationUserMapping._id },
      //     {
      //       $set: {
      //         [updateField]: !isFailed
      //           ? EDeliveryChannelStatus.SUCCESS
      //           : EDeliveryChannelStatus.FAILED,
      //         failed_count: failedCount,
      //         delivered_at: !isFailed
      //           ? new Date()
      //           : notificationUserMapping.delivery_channel_status[updateIndex].delivered_at
      //       }
      //     }
      //   );
      // }
      this.loggerService.log(
        `SMS notification sent successfully to user - ${userId}, notificationId - ${notificationId}`
      );
      return true;
    } catch (err) {
      this.loggerService.error(
        `Error occured while sending SMS notification to user - ${userId}, notificationId - ${notificationId}`,
        null
      );
      this.loggerService.error(`Error: ${err}`);
      return false;
    }
  }

  async getPendingAndFailedNotifications() {
    const notifications = await this.notificationToUserRepository.aggregate([
      {
        $match: {
          delivery_channel_status: {
            $elemMatch: {
              delivery_status: {
                $in: ['PENDING', 'FAILED']
              },
              failed_count: { $lte: RETRY_THRESHOLD }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'notificationChannel',
          localField: 'notification_id',
          foreignField: 'notification_id',
          as: 'notificationChannel'
        }
      },
      {
        $project: {
          notification_id: 1,
          user_id: 1,
          channel: 1,
          delivery_channel_status: 1
        }
      }
    ]);

    if (!notifications.length) {
      this.loggerService.log('No pending or failed notifications found that can be triggered');
      return;
    }
    this.loggerService.log('Pending or failed notifications found that can be triggered');

    for (const notification of notifications) {
      const { notification_id, user_id, delivery_channel_status } = notification;

      for (const deliveryChannel of delivery_channel_status) {
        if (
          [EDeliveryChannelStatus.PENDING, EDeliveryChannelStatus.FAILED].includes(
            deliveryChannel.delivery_status
          ) &&
          deliveryChannel.failed_count <= RETRY_THRESHOLD
        ) {
          switch (deliveryChannel.channel) {
            case 'In-app':
              await this.subscribeInAppNotification({
                notificationId: notification_id,
                channel: deliveryChannel.channel,
                userId: user_id,
                retry: true
              });
              break;
            case 'Email':
              await this.subscribeEmailNotification({
                notificationId: notification_id,
                channel: deliveryChannel.channel,
                userId: user_id,
                retry: true
              });
              break;
            case 'SMS':
              await this.subscribeSMSNotification({
                notificationId: notification_id,
                channel: deliveryChannel.channel,
                userId: user_id,
                retry: true
              });
              break;
            case 'Whatsapp':
              break;
          }
        }
      }
    }
    this.loggerService.log(`Retrying of pending and failed notifications completed`);
    return;
  }

  // send communication to user
  async sendCommunicationNotification(
    payload: { [key: string]: any },
    reqBody: { [key: string]: any }
  ) {
    let notificationData = { slug: payload.slug };
    this.loggerService.log(`Sending notification with payload: ${JSON.stringify(payload)}`);

    if (payload.modes.includes('email') && payload.mailTo.length > 0) {
      notificationData['email'] = [];
      if (process.env.SEND_TEST_EMAIL === 'true') {
        var emailList = process.env.DEV_EMAIL.split(',');
        for (let email of emailList) {
          notificationData['email'].push(email);
          this.mailService.sendDynamicEmail(
            reqBody,
            email,
            payload.mail.subject,
            payload.mail.body,
            payload.attachment
          );
        }
      } else {
        for (let email of payload.mailTo) {
          notificationData['email'].push(email);
          this.mailService.sendDynamicEmail(
            reqBody,
            email,
            payload.mail.subject,
            payload.mail.body,
            payload.attachment
          );
        }
      }
    }

    if (payload.modes.includes('sms') && payload.smsTo.length > 0) {
      notificationData['sms'] = [];
      for (const user of payload.smsTo) {
        notificationData['sms'].push(user);
        payload.whatsapp = `123 is your on time Vector verification code -VIBGYOR`;
        this.messageService.SendTextMessage(reqBody, user, payload.message);
      }
    }

    if (payload.modes.includes('whatsapp') && payload.smsTo.length > 0) {
      notificationData['whatsapp'] = [];
      for (const user of payload.smsTo) {
        notificationData['whatsapp'].push(user);
        payload.whatsapp = `123 is your on time Vector verification code -VIBGYOR`;
        this.messageService.whatsappSendSMS(reqBody, user, payload.whatsapp);
      }
    }

    if (payload.modes.includes('push') && payload.appToken.length > 0) {
      notificationData['push'] = [];
      for (const token of payload.appToken) {
        notificationData['push'].push(token);
        this.firebaseService.sendPushNotification(
          reqBody,
          token,
          payload.pushMsg.subject,
          payload.pushMsg.body,
          { slug: payload.slug, ...payload.param }
        );
      }
    }
    console.log('NOTIFICATION_SEND', JSON.stringify(notificationData));
  }

  async getParentIds(userIds: string[] | number[]) {
    let parentIds = [];
    for (const user of userIds) {
      try {
        const userDetails: any = await axios.get(
          process.env.ADMIN_BASE_URL + 'admin/studentProfile/' + Number(user)
        );

        if (
          userDetails?.data?.data?.parent &&
          Array.isArray(userDetails?.data?.data?.parent) &&
          userDetails?.data?.data?.parent?.length > 0
        ) {
          const parentGlobalNos = userDetails?.data?.data?.parent?.map((parent: any) => {
            return parent?.global_no;
          });

          const queryString = qs.stringify({
            filters: {
              global_number: { $in: parentGlobalNos }
            }
          });

          try {
            const coGlobalParentDetails = await axios.get(`${USER_DETAILS}?${queryString}`, {
              headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
            });

            if (
              coGlobalParentDetails?.data?.data &&
              Array.isArray(coGlobalParentDetails?.data?.data)
            ) {
              const parentIdsFromResponse = coGlobalParentDetails.data.data.map((parent: any) => {
                return parent.id;
              });
              parentIds.push(...parentIdsFromResponse);
            }
          } catch (error) {
            console.error(`Error occurred while fetching parent details for user ${user}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`Error occurred while fetching parent details for user ${user}:`, error);
        continue;
      }
    }
    return parentIds;
  }

  async createIndividualNotification(
    master_id: string,
    param: object,
    values: { [key: string]: string },
    cc_group_id?: number,
    mode_id?: any,
    individualType?: string,
    userId?: any
  ): Promise<void> {
    try {
      const parentIds = await this.getParentIds(userId);
      let data = [];

      console.log('communication_mode_id individual', mode_id);
      for (let mode of mode_id) {
        const updatedValues = {
          ...values,
          mode: {
            [mode]: {
              subject: values.subject,
              content: values.content
            }
          }
        };

        for (let id of parentIds) {
          data.push({
            user_id: id,
            user_type: 2,
            group_id: null,
            communication_master_id: String(master_id),
            ...updatedValues
          });
        }
      }

      // Send notifications
      if (data.length) {
        await this.notificationToUserService.createMany(data);
      }
    } catch (error) {
      console.error('Error creating individual notification:', error);
      throw error;
    }
  }

  async createNotificationToUser(
    master_id: string,
    param: object,
    values: { [key: string]: string },
    groupId?: number
  ) {
    const communicationMaster: { [key: string]: any } =
      await this.communicationMasterService.getById(master_id);

    /*if (communicationMaster?.sub_category === 'Others') {
      communicationMaster['communication_modes'] = [
        {
          _id: '68402601929c1a6e7ccc0840',
          communication_master_id: '68402006929c1a6e7ccc07fa',
          mode_id: '67b6d34d6f289a31d8f832d7',
          subject: values?.subject || '',
          content: values?.content || '',
          createdAt: '2025-06-04T10:54:57.686Z',
          updatedAt: '2025-06-04T10:54:57.686Z',
          __v: 0,
          communicationMode: [
            {
              _id: '67b6d34d6f289a31d8f832d7',
              mode_of_communication: 'daily_updates'
            }
          ],
          id: '68402601929c1a6e7ccc0840'
        }
      ];
    }*/
    let mode_id: string = '';
    let modeIds: string[] = [];
    for (const element of communicationMaster.communication_modes) {
      let temp = await this.communicationModeService.findOne(element.mode_id);
      if (null != temp) {
        mode_id = String(temp['_id']);
        modeIds.push(String(temp['_id']));
      }
    }

    if (modeIds.length == 0) {
      modeIds.push(values?.mode.length > 0 && values?.mode[0].toString());
    }
    console.log('communication_mode_id', mode_id);

    const communication_modes: { [key: string]: any } =
      communicationMaster.communication_modes.find(
        (object: { [key: string]: string }) => object.mode_id == mode_id
      );

    let employeeIds = await this.communicationMasterService.getEmployees(groupId);
    // let staffIds = await this.communicationMasterService.getEmployees([cc_group_id]);
    console.log('users', employeeIds);

    let subject = values?.subject;
    let content = values?.content;
    for (const key in param) {
      subject = subject.replace(`{{${key}}}`, param[key]);
      content = content.replace(`{{${key}}}`, param[key]);
    }
    let mode = {
      [mode_id]: {
        subject: subject,
        content: content
      }
    };
    let modes = modeIds.map((mode) => ({
      [mode]: {
        subject: subject,
        content: content
      }
    }));

    // removing mode from values because it is replacing the mode object
    delete values.mode;

    let data = [];
    for (const groupId in employeeIds) {
      for (const key in employeeIds[groupId]) {
        for (const element of employeeIds[groupId][key]) {
          modes.forEach((mode) => {
            let temp = {
              user_id: element,
              user_type: key == 'employee_id' ? 1 : 2,
              group_id: groupId,
              mode: mode,
              communication_master_id: String(master_id),
              otherSubCategory: values?.otherSubCategory || ''
            };

            temp = { ...temp, ...values };

            data.push(temp);
          });
        }
      }
    }

    // for (const groupId in staffIds) {
    //   for (const key in staffIds[groupId]) {
    //     for (const element of staffIds[groupId][key]) {
    //       modes.forEach((mode) => {
    //         let temp = {
    //           user_id: element,
    //           user_type: key == 'employee_id' ? 1 : 2,
    //           group_id: groupId,
    //           mode: mode,
    //           communication_master_id: String(master_id)
    //         };

    //         temp = { ...temp, ...values };

    //         data.push(temp);
    //       });
    //     }
    //   }
    // }

    if (data.length > 0) {
      await this.notificationToUserService.createMany(data);
    }
  }

  async uploadDocument(document: Express.Multer.File) {
    let fileName: string | string[] = document.originalname;

    function exportFileName(fileName) {
      fileName = fileName.split('.');
      let ext = fileName.slice(-1).pop();
      fileName.pop();
      fileName = fileName.join('_');

      fileName = fileName
        .replace(/[^/a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      fileName = fileName.split('/');
      let name = fileName.slice(-1).pop();
      name = name + '_' + new Date().getTime();
      fileName.pop();
      if (fileName.length > 0) {
        fileName = fileName.join('/') + '/' + name;
      } else {
        fileName = name;
      }

      return fileName + '.' + ext;
    }

    fileName = exportFileName(fileName);

    const gcsSetup = new GoogleCloudStorageConfigService();
    const storageService = await gcsSetup.configureGoogleCloudStorage();
    const uploadedFileName = await storageService.uploadFile(document, fileName);

    if (!uploadedFileName) {
      throw new HttpException(
        'Something went wrong while uploading file!',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    fileName = uploadedFileName.split('/');
    return fileName.pop();
  }

  async getUploadedDocumentUrl(id: string, download: boolean = true) {
    const file = `communication/${id}`;
    const bucketName = process.env.BUCKET_NAME;
    const folderName = process.env.FOLDER_NAME;

    this.storageService.setStorage(EStorageType.GCS, {
      projectId: process.env.PROJECT_ID,
      credentials: {
        type: process.env.TYPE,
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.GCS_CLIENT_ID,
        auth_uri: process.env.AUTH_URI,
        token_uri: process.env.TOKEN_URI,
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSAL_DOMAIN
      },
      bucketName: bucketName,
      folderName: folderName
    });

    const signedUrl = await this.storageService.getSignedUrl(bucketName, file, download);
    return signedUrl;
  }

  async getStudentDetails(enr: string, lobIds: any, token: any) {
    try {
      let payload = {
        global_search: enr,
        grade: null,
        board: null,
        shift: null,
        division: null,
        lob_ids: lobIds
      };
      let URL = AC_STUDENTS;
      let studentId = await axios.post(`${URL}`, payload, {
        headers: { Authorization: 'Bearer ' + TICKET_TOKEN }
      });

      let studentPayload = {
        student_id: studentId?.data?.data?.students[0]?.id,
        lob_ids: lobIds
      };
      const studentDetails = await axios.post(`${SIBLING_LIST}`, studentPayload, {
        headers: { Authorization: 'Bearer ' + TICKET_TOKEN }
      });

      const queryString = qs.stringify(
        { filters: { student_id: studentId?.data?.data?.students[0]?.id } },
        { encodeValuesOnly: true }
      );
      const getStudentSubject = await axios.get(
        `${MDM_URL}/ac-nss-subject-selecteds?${queryString}`,
        {
          headers: { Authorization: 'Bearer ' + TICKET_TOKEN }
        }
      );

      const subjectId = [];

      getStudentSubject?.data?.data.map((i) => subjectId.push(i?.attributes?.subject_id));

      const finalResponse = {
        data: [
          {
            ...studentDetails?.data?.data?.students[0],
            subject_id: subjectId
          }
        ]
      };
      return finalResponse;
    } catch (error) {
      console.log(error);
    }
  }

  async getParentDetails(payload: any, token: string) {
    try {
      // Step 1: Get student details from internal service
      const studentDetails: any = await this.getStudentDetails(
        payload?.global_search,
        payload?.lobIds,
        token
      );
      if (!studentDetails) return null;

      // Step 2: Fetch workload data from API
      const workloadResponse = await axios.post(
        ACADEMICS_WORKLOAD,
        {
          page: 1,
          pageSize: 1000,
          hr_employee_master_id: payload?.hr_employee_master_id
        },
        {
          headers: { Authorization: `${token}` }
        }
      );

      const workLoadData = workloadResponse?.data?.data?.data;

      // if (!Array.isArray(data)) return null;

      // Step 3: Collect unique values from workload data
      const board: any[] = [];
      const grade: any[] = [];
      const div: any[] = [];
      const school: any[] = [];
      const subject: any[] = [];
      const shift: any[] = [];
      const stream: any[] = [];
      const course: any[] = [];

      workLoadData?.forEach((i) => {
        if (!board.includes(i.board_id)) board.push(i.board_id);
        if (!grade.includes(i.grade_id)) grade.push(i.grade_id);
        if (!div.includes(i.division_id)) div.push(i.division_id);
        if (!school.includes(i.school_id)) school.push(i.school_id);
        if (!subject.includes(i.subject_id)) subject.push(i.subject_id);
        if (!shift.includes(i.shift_id)) shift.push(i.shift_id);
        if (!stream.includes(i.stream_id)) stream.push(i.stream_id);
        if (!course.includes(i.course_id)) course.push(i.course_id);
      });

      // Step 4: Validate if student details match workload set
      let boardValid = false;
      if (board.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        boardValid = true;
      } else {
        boardValid = board.includes(studentDetails.data[0].board_id);
      }

      let gradeValid = false;
      if (grade.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        gradeValid = true;
      } else {
        gradeValid = grade.includes(studentDetails.data[0].grade_id);
      }

      let divValid = false;
      if (div.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        divValid = true;
      } else {
        divValid = div.includes(studentDetails.data[0].division_id);
      }

      let schoolValid = false;
      if (school.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        schoolValid = true;
      } else {
        schoolValid = school.includes(studentDetails.data[0].school_id);
      }

      let shiftValid = false;
      if (shift.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        shiftValid = true;
      } else {
        shiftValid = shift.includes(studentDetails.data[0].shift_id);
      }

      let subjectValid = false;
      if (subject.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        subjectValid = true;
      } else {
        subjectValid = hasCommonNumber(studentDetails?.data[0]?.subject_id, subject);
      }

      let streamValid = false;
      if (stream.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        streamValid = true;
      } else {
        streamValid = stream.includes(studentDetails.data[0].stream_id);
      }

      let courseValid = false;
      if (course.some((el) => el == null || (typeof el === 'string' && el.trim() === ''))) {
        courseValid = true;
      } else {
        courseValid = course.includes(studentDetails?.data[0].course_id.toString());
      }

      const isValid =
        boardValid ||
        gradeValid ||
        divValid ||
        schoolValid ||
        shiftValid ||
        subjectValid ||
        streamValid ||
        courseValid;

      console.log(board.includes(studentDetails?.data[0].board_id));

      console.log(grade.includes(studentDetails?.data[0].grade_id), 'grade');
      console.log(div.includes(studentDetails?.data[0].division_id), 'div');
      console.log(school.includes(studentDetails?.data[0].school_id), 'school');
      console.log(shift.includes(studentDetails?.data[0].shift_id), 'shift');
      console.log(hasCommonNumber(studentDetails?.data[0]?.subject_id, subject), 'subject');
      console.log(stream.includes(studentDetails?.data[0].stream_id), 'stream');
      console.log(course.includes(studentDetails?.data[0].course_id), 'course');

      console.log(
        'Valid values ',
        isValid,
        boardValid,
        gradeValid,
        divValid,
        schoolValid,
        shiftValid,
        subjectValid,
        streamValid,
        courseValid
      );
      // Step 5: Return result
      //  isValid ? studentDetails?.data : null;
      if (isValid) {
        const finalData = studentDetails?.data.map((i) => {
          const enrollmentNumber = i?.student_display_name?.split(' - ')[1];
          return {
            id: i?.id,
            label: i?.student_display_name,
            value: enrollmentNumber
            // enrNo:i?.
          };
        });
        return finalData;
      } else return null;
    } catch (error) {
      console.error('Error in getParentDetails:', error);
      return null;
    }
  }

  async sendOTP(number: number) {
    try {
      const status = await this.otpRepository.findOne(number);
      if (status?.isBlocked) {
        this.loggerService.log('OTP is blocked for 24 hours:', status);
        return { success: false, message: 'This number is blocked for 24 hours.' };
      }
      const otp = generateOtp(6);
      this.loggerService.log('otp generated:', otp as any);
      const otpValidTill = 5;
      if (status?.number) {
        const isBlocked = status.sendRetryCount >= 2;

        const dbRes = await this.otpRepository.updateOne(number, {
          sendRetryCount: status.sendRetryCount + 1,
          otp,
          isBlocked: isBlocked,
          expiresAt: isBlocked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : status?.expiresAt
        });
        this.loggerService.log('OTP updated in  DB: ', dbRes);
      } else {
        const dbRes = await this.otpRepository.create({
          number: number,
          otp
        });
        this.loggerService.log('OTP created in DB: ', dbRes);
      }
      const msg = `${otp} is your one-time verification code for password recovery. Your OTP is valid for ${otpValidTill} minutes -VIBGYOR`;
      this.messageService.SendTextMessage({ number }, number, msg);
      return { success: true, message: 'OTP sent', data: { success: true } };
    } catch (error) {
      this.loggerService.error('send sms error block:', error);
      return { success: false, message: 'Failed to send OTP.' };
    }
  }
  async verifyOTP(number: number, otp: number) {
    try {
      const status = await this.otpRepository.findOne(number);
      if (!status) {
        this.loggerService.log(`NO record exist for this number: ${number}`);
        return { success: false, message: 'No record exists for this number.' };
      }

      if (status?.isBlocked) {
        this.loggerService.log('OTP is blocked for 24 hours:', status);
        return { success: false, message: 'This number is blocked for 24 hours.' };
      }
      if (status?.otp !== otp) {
        this.loggerService.log(`Invalid OTP ${otp} for number: ${number}`);
        const isBlocked = status.sendRetryCount >= 2;
        const dbRes = await this.otpRepository.updateOne(number, {
          verifyRetryCount: status.verifyRetryCount + 1,
          isBlocked: isBlocked,
          expiresAt: isBlocked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : status?.expiresAt
        });
        this.loggerService.log('OTP updated in DB: ', dbRes);
        return { success: false, message: 'Invalid OTP.' };
      }
      if (status?.otp === otp || status?.number === number) {
        const dbRes = await this.otpRepository.deleteOne(number);
        this.loggerService.log('OTP deleted from DB: ', dbRes);
      }

      return { success: true, message: 'OTP verified successfully', data: { success: true } };
    } catch (error) {
      this.loggerService.error('send sms error block:', error);
      return { success: false, message: 'Failed to send OTP.' };
    }
  }
}
