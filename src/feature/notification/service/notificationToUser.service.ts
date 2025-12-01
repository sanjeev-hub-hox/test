import { Types } from 'mongoose';
import { NotificationToUserModel } from '../schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  MarkNotificationsAsReadRequestSchema,
  GetNotificationsByPortalIdRequestQuery
} from '../dto';
import { NotificationToUserRepository } from '../repository';
import { LoggerService, NOTIFICATION_LIST_TYPE } from '../../../utils';
import { TNotificationToUser } from '../type';

@Injectable()
export class NotificationToUserService {
  constructor(
    @InjectModel('notificationToUser')
    private model: NotificationToUserModel,
    private notificationToUserRepository: NotificationToUserRepository,
    private loggerService: LoggerService
  ) {}

  // async getPaginatedPortalNotifications(
  //   pageNumber: number,
  //   pageSize: number,
  //   sort: string,
  //   sortBy: string,
  //   portalId: number,
  //   userId: number,
  //   readType: string,
  //   timeRange: string,
  //   important: boolean
  // ) {
  //   const matchCondition = {
  //     user_id: userId,
  //     deleted_at: { $eq: null }
  //   };
  //   const dateCondition = {};
  //   const currentDate = new Date();

  //   switch (readType) {
  //     case 'unread':
  //       matchCondition['read_at'] = {
  //         $eq: null
  //       };
  //       break;
  //     case 'read':
  //       matchCondition['read_at'] = {
  //         $ne: null
  //       };
  //       break;
  //   }

  //   switch (timeRange) {
  //     case 'lastweek':
  //       dateCondition['notification_details.created_at'] = {
  //         $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // Start of last week
  //         $lt: new Date() // Current date (end of last week)
  //       };
  //       break;
  //     case 'thisweek':
  //       // Get the start of the current week (Sunday)
  //       const startOfWeek = new Date(currentDate);
  //       startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  //       // Get the end of the current week (Saturday)
  //       const endOfWeek = new Date(currentDate);
  //       endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));

  //       dateCondition['notification_details.created_at'] = {
  //         $gte: startOfWeek, // Start of the current week
  //         $lt: endOfWeek //
  //       };
  //       break;
  //     case 'lastmonth':
  //       // Get the start of the last month
  //       const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  //       // Get the end of the last month
  //       const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  //       dateCondition['notification_details.created_at'] = {
  //         $gte: startOfLastMonth, // Start of the last month
  //         $lte: endOfLastMonth // End of the last month
  //       };
  //       break;
  //   }

  //   const aggregrateQuery: any = [
  //     {
  //       $match: matchCondition
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         __v: 0
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'notification',
  //         localField: 'notification_id',
  //         foreignField: '_id',
  //         as: 'notification_details',
  //         pipeline: [
  //           {
  //             $match: {
  //               generated_to_portal_id: portalId,
  //               ...(important !== undefined ? { is_important: important } : {})
  //             }
  //           },
  //           {
  //             $project: {
  //               __v: 0
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       $unwind: {
  //         path: '$notification_details',
  //         preserveNullAndEmptyArrays: false
  //       }
  //     }
  //   ];
  //   if (timeRange) {
  //     aggregrateQuery.push({
  //       $match: dateCondition
  //     });
  //   }
  //   if (sort && sortBy) {
  //     aggregrateQuery.push({
  //       $sort: {
  //         [sort]: sortBy === 'asc' ? 1 : -1
  //       }
  //     });
  //   }
  //   aggregrateQuery.push(
  //     {
  //       $facet: {
  //         totalCount: [{ $count: 'value' }],
  //         paginatedResults: [
  //           {
  //             $skip: (pageNumber - 1) * pageSize
  //           },
  //           {
  //             $limit: pageSize
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       $project: {
  //         totalCount: { $arrayElemAt: ['$totalCount.value', 0] },
  //         isNextPage: {
  //           $cond: {
  //             if: {
  //               $gt: [{ $arrayElemAt: ['$totalCount.value', 0] }, pageSize * pageNumber]
  //             },
  //             then: true,
  //             else: false
  //           }
  //         },
  //         data: '$paginatedResults'
  //       }
  //     }
  //   );
  //   this.loggerService.log(`Aggregate query : ${JSON.stringify(aggregrateQuery)}`);
  //   return this.model.aggregate(aggregrateQuery);
  // }

  // async getPortalNotifications(
  //   portalId: number,
  //   queryString: GetNotificationsByPortalIdRequestQuery
  // ): Promise<any> {
  //   const { pageNumber, pageSize } = queryString;
  //   const notifications: any = await this.getPaginatedPortalNotifications(
  //     Number(pageNumber),
  //     Number(pageSize),
  //     queryString.sort ?? null,
  //     queryString.sortBy ?? null,
  //     portalId,
  //     Number(queryString.userId),
  //     queryString.readType ?? null,
  //     queryString.timeRange ?? null,
  //     queryString?.important ? (queryString.important === 'true' ? true : false) : undefined
  //   );

  //   if (notifications && notifications?.[0]?.data) {
  //     const userNotifications = notifications?.[0]?.data;

  //     const notificationIdIndexMap = [];
  //     userNotifications.forEach((notification, index: number) => {
  //       const { notification_details } = notification;
  //       if (notification_details?.is_to_user_visible) {
  //         notificationIdIndexMap.push({
  //           notificationId: notification_details._id.toString(),
  //           index: index
  //         });
  //       }
  //     });

  //     if (notificationIdIndexMap.length) {
  //       const otherUserPromises = [];
  //       for (const mapping of notificationIdIndexMap) {
  //         otherUserPromises.push(
  //           this.notificationToUserRepository.getMany(
  //             {
  //               notification_id: new Types.ObjectId(mapping.notificationId),
  //               user_id: { $ne: Number(queryString.userId) }
  //             },
  //             {}
  //           )
  //         );
  //       }

  //       const otherUsers = await Promise.all(otherUserPromises);

  //       if (otherUsers.length) {
  //         otherUsers.flat().forEach((user) => {
  //           const notificationIds = notificationIdIndexMap.map((e) => e.notificationId);
  //           const index = notificationIds.indexOf(user.notification_id.toString());
  //           const mapIndex = notificationIdIndexMap[index].index;

  //           if (userNotifications[mapIndex].notification_details['otherUsers']) {
  //             userNotifications[mapIndex].notification_details['otherUsers'].push(user);
  //           } else {
  //             userNotifications[mapIndex].notification_details['otherUsers'] = [user];
  //           }
  //         });
  //       }
  //     }
  //   }
  //   return notifications;
  // }

  async updateByCommunicationId(communication_id: string, value: Partial<TNotificationToUser>) {
    const updateResult = await this.notificationToUserRepository.updateMany(
      { communication_id: { $eq: communication_id } },
      value
    );
  }

  async deleteByCommunicationId(communication_id: string) {
    await this.notificationToUserRepository.deleteByCommunicationId(communication_id);
  }

  async softDeleteByMasterId(master_id: string, data: Partial<TNotificationToUser>) {
    await this.notificationToUserRepository.updateMany(
      { communication_master_id: { $eq: master_id } },
      data
    );
  }

  async markNotificationsAsRead(body: MarkNotificationsAsReadRequestSchema) {
    const { notificationIds, userId } = body;

    const updateResult = await this.notificationToUserRepository.updateMany(
      {
        _id: {
          $in: notificationIds.map((notificationId) => new Types.ObjectId(notificationId))
        },
        user_id: userId
      },
      {
        read_at: new Date(),
        ...(body?.portalId ? { read_on_portal_id: body?.portalId } : {})
      }
    );
    if (!updateResult.modifiedCount) {
      return false;
    }
    return true;
  }

  // async deleteUserNotification(notificationId: string, userId: number): Promise<any> {
  //   const updateResult: any = await this.notificationToUserRepository.updateOne(
  //     {
  //       notification_id: new Types.ObjectId(notificationId),
  //       user_id: userId
  //     },
  //     {
  //       deleted_at: new Date()
  //     }
  //   );
  //   if (!updateResult.modifiedCount) {
  //     return false;
  //   }
  //   return true;
  // }

  async createMany(data: TNotificationToUser[]): Promise<TNotificationToUser[]> {
    return this.notificationToUserRepository.createMany(data);
  }

  async getUserNotification(
    user_id: number,
    user_type: number,
    type: string = NOTIFICATION_LIST_TYPE.all_today,
    communication_master_id: string,
    page: number = 1,
    limit: number = 10,
    isWebApp: boolean = false
  ) {
    return await this.notificationToUserRepository.getUserNotificationWithFilters(
      user_id,
      user_type,
      type,
      communication_master_id,
      page,
      limit,
      isWebApp
    );
  }
}
