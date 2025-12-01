import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ESendNotificationChannels } from '../type';

const userSchema = z.object({
  mobile: z.number(),
  email: z.string().email()
});

export const notificationSchema = z.object({
  notificationId: z.number().describe('Id of notification'),
  shortSubject: z.string().describe('Short subject of notification'),
  subject: z.string().describe('In detail subject of notification'),
  body: z.string().describe('Body or description of notification'),
  link: z.string().describe('Link of notification'),
  isSystemGenerated: z
    .boolean()
    .default(false)
    .describe('Boolean flag which indicates whether this notification is system generated or not'),
  isImportant: z
    .boolean()
    .default(false)
    .describe(
      'Boolean flag which indicates whether this notification is an important notification or not'
    ),
  addedBy: z.number().describe('The reference to the user who added this notification'),
  isToUserVisible: z
    .boolean()
    .describe(
      'Boolean flag which indicates whether to show or not the list of users whom this notification is sent'
    ),
  generatedFromPortalId: z
    .number()
    .describe('Id of portal from which this notification is generated'),
  generatedToPortalId: z.number().describe('Id of portal for which this notification is generated'),
  createdAt: z.string().describe('time stamp at which notification is created'),
  updatedAt: z.string().describe('time stamp at which notification is updated')
});

// export const sendNotificationRequestSchema = z.object({
//   template_slug: z
//     .string()
//     .optional()
//     .describe('slug name of the template which is to be used while sending notification'),
//   userIds: z
//     .array(z.number())
//     .min(1)
//     .describe('Id of users to whom this notification is to be sent'),
//   channels: z
//     .array(
//       z.object({
//         name: z
//           .enum([
//             ESendNotificationChannels.email,
//             ESendNotificationChannels.inApp,
//             ESendNotificationChannels.sms,
//             ESendNotificationChannels.whatsapp
//           ])
//           .describe('Name of the channel on which this notification must be sent'),
//         subject: z.string().optional().describe('Subject of the notification'),
//         body: z.string().optional().describe('Body of the notification'),
//         link: z.string().optional().describe('Link of the notification'),
//         variables: z
//           .array(
//             z.object({
//               name: z.string().describe('Name of the placeholder in the template'),
//               value: z.string().describe('Value of the placeholder in the template')
//             })
//           )
//           .optional()
//       })
//     )
//     .min(1)
//     .describe('list of channel Ids on which this notification is to be sent'),
//   generated_from_portal_id: z
//     .number()
//     .optional()
//     .describe('The id of the portal from where this notification is sent'),
//   generated_to_portal_id: z
//     .number()
//     .optional()
//     .describe('The id of the portal to which this notification is sent'),
//   is_system_generated: z
//     .boolean()
//     .optional()
//     .describe(
//       'A flag which indicates whether this notification is system generated notification or not'
//     ),
//   is_important: z
//     .boolean()
//     .optional()
//     .describe('A flag which indicates whether this notification is an important one or not'),
//   added_by: z.number().optional().describe('User who added this notification'),
//   is_to_user_visible: z
//     .boolean()
//     .optional()
//     .describe('Flag based on which other users to whom this notification is sent is visible'),
//   type: z.string().optional().describe('Type of notification'),
//   communication_master_id: z.string().describe('To get communication mode'),
//   users: z.array(userSchema).optional()
// });

export const sendNotificationRequestSchema = z.object({
  slug: z.string().describe('Set template of global notification send by slug name.'),
  employee_ids: z.array(z.number()).optional().describe('Employee ids list.'),
  global_ids: z.array(z.number()).optional().describe('Global User ids list.'),
  global_nos: z.array(z.string()).optional().describe('Global User number list.'),
  student_ids: z.array(z.number()).optional().describe('Student ids list.'),
  to_mail: z.array(z.string()).optional().describe('Receiver mail ids list.'),
  to_mobile: z.array(z.string()).optional().describe('Receiver mobile no list.'),
  communication_id: z.string().optional().describe('Communication ID.'),
  attachment: z
    .object({
      filename: z.string().optional().describe('Name for the file.'),
      content: z.string().optional().describe('File content.')
    })
    .optional()
    .describe('Attachment to send in email.'),
  param: z
    .record(z.string(), z.string())
    .optional()
    .describe('data pass in global notification send.')
});

export const createNotificationRequestSchema = z.object({
  type: z.string().describe('Type of notification'),
  slug: z.string().optional().describe('Notificatio template slug'),
  shortSubject: z.string().optional().describe('Short subject of the notification'),
  subject: z.string().optional().describe('Subject of notification'),
  body: z.string().optional().describe('Body of notification'),
  link: z.string().optional().describe('Link of notification'),
  isSystemGenerated: z
    .boolean()
    .optional()
    .describe(
      'A flag which indicates whether this notification is system generated notification or not'
    ),
  isImportant: z
    .boolean()
    .optional()
    .describe('A flag which indicates whether this notification is an important one or not'),
  addedBy: z.number().describe('User who added this notification'),
  isToUserVisible: z
    .boolean()
    .describe('Flag based on which other users to whom this notification is sent is visible'),
  generatedFromPortalId: z.number().describe('Portal from which this notification is sent'),
  generatedToPortalId: z.number().describe('Portal to which this notification is sent'),
  tags: z
    .array(z.string())
    .optional()
    .describe('List of tags which are assigned to this notification'),
  channels: z
    .array(
      z.object({
        channel: z.string().describe('Name of the channel'),
        deliveryStatus: z.string().describe('Delivery status of channel'),
        delieveredAt: z
          .string()
          .optional()
          .describe('Timestamp at which this notification was delivered over this channel')
      })
    )
    .min(1)
    .describe('Channel details list on whicch this notification is sent'),
  userIds: z
    .array(z.number())
    .min(1)
    .describe('Id of users to whom this notification is to be sent')
});

export const paginationRequestQuerySchema = z.object({
  pageNumber: z.string().describe('Current page number'),
  pageSize: z.string().describe('The amount of data to be shown in a single page'),
  sortBy: z.string().describe('Sorting order, ascending or descending'),
  sort: z.string().describe('Field name on which sorting needs to performed')
});

export const markNotificationsAsReadRequestSchema = z.object({
  notificationIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification id'))
    .describe('Id of notifications which are to marked as read'),
  userId: z.number().describe('Id of the user'),
  portalId: z.number().optional().describe('Id of the portal on which this notification is read')
});

export const paginatedNotificationResponseSchema = z.object({
  totalCount: z.number().describe('total data'),
  isNextPage: z.boolean().describe('Is next page available'),
  data: z.array(notificationSchema)
});

export const availablePortalResponseSchema = z.object({
  id: z.string().describe('Id of the portal'),
  name: z.string().describe('Name of the portal'),
  icon: z.string().describe('Icon image of the portal'),
  image: z.string().describe('Image of the portal'),
  isActive: z.string().describe('Active status of the portal'),
  orderNo: z.string().describe('Order number of the portal'),
  url: z.string().describe('URL link of the portal'),
  count: z.string().describe('Count of notifications against this portal for this user')
});

export const activePortalResponseSchema = z.object({
  id: z.string().describe('Id of the portal'),
  name: z.string().describe('Name of the portal'),
  icon: z.string().describe('Icon image of the portal'),
  image: z.string().describe('Image of the portal'),
  isActive: z.string().describe('Active status of the portal'),
  orderNo: z.string().describe('Order number of the portal'),
  url: z.string().describe('URL link of the portal')
});

export const portalDetailResponseSchema = z.object({
  totalCount: z.number().describe('total data'),
  isNextPage: z.boolean().describe('Is next page available'),
  data: z.array(
    z.object({
      notificationId: z.string().describe('Notification Id '),
      userId: z.string().describe('Id of the current user'),
      readAt: z.string().describe('Time stamp at which this notification was read'),
      readOnPortalId: z.number().describe('Portal Id on which this notification was read by user'),
      deletedAt: z
        .string()
        .describe('Time stamp at which this user notification mapping was deleted'),
      createdAt: z
        .string()
        .describe('Time stamp at which this user notification mapping was created'),
      updatedAt: z
        .string()
        .describe('Time stamp at which this user notification mapping was updated'),
      notificationDetails: z.array(
        z.object({
          _id: z.string().describe('Unique identifier'),
          notificationId: z.string().describe('Notification Id'),
          shortSubject: z.string().describe('Short subject of notification'),
          subject: z.string().describe('In detail subject of notification'),
          body: z.string().describe('Body or description of notification'),
          link: z.string().describe('Link of notification'),
          isSystemGenerated: z
            .boolean()
            .default(false)
            .describe(
              'Boolean flag which indicates whether this notification is system generated or not'
            ),
          isImportant: z
            .boolean()
            .default(false)
            .describe(
              'Boolean flag which indicates whether this notification is an important notification or not'
            ),
          addedBy: z.number().describe('The reference to the user who added this notification'),
          isToUserVisible: z
            .boolean()
            .describe(
              'Boolean flag which indicates whether to show or not the list of users whom this notification is sent'
            ),
          generatedFromPortalId: z
            .number()
            .describe('Id of portal from which this notification is generated'),
          generatedToPortalId: z
            .number()
            .describe('Id of portal for which this notification is generated'),
          createdAt: z.string().describe('time stamp at which notification is created'),
          updatedAt: z.string().describe('time stamp at which notification is updated'),
          otherUsers: z
            .array(
              z.object({
                notificationId: z.string().describe('Notification Id '),
                userId: z.string().describe('Id of the current user'),
                readAt: z.string().describe('Time stamp at which this notification was read'),
                readOnPortalId: z
                  .number()
                  .describe('Portal Id on which this notification was read by user'),
                deletedAt: z
                  .string()
                  .describe('Time stamp at which this user notification mapping was deleted'),
                createdAt: z
                  .string()
                  .describe('Time stamp at which this user notification mapping was created'),
                updatedAt: z
                  .string()
                  .describe('Time stamp at which this user notification mapping was updated')
              })
            )
            .optional()
            .describe('List of user details, this field is dependent on isToUserVisible field')
        })
      )
    })
  )
});

export const getNotificationsByPortalIdRequestQuerySchema = z.object({
  userId: z.string().describe('Id of the user'),
  readType: z
    .string()
    .optional()
    .describe('Are notifications read, accepted values: unread and read'),
  timeRange: z
    .string()
    .optional()
    .describe(
      'Notifications within the certain range, accepted values: thisweek, lastweek and lastmonth'
    ),
  important: z
    .string()
    .optional()
    .describe('Notifications mmarked as important, accepted values: true, false'),
  sort: z.string().optional().describe('Sorting order'),
  sortBy: z.string().optional().describe('Field name on which sorting needs to be performed'),
  pageSize: z.string().describe('Amount of data to be shown in a single page'),
  pageNumber: z.string().describe('Current page number')
});

export const readCountRequestSchema = z.object({
  portalId: z.number().describe('Notification portal id'),
  userId: z.number().describe('User id')
});

export const readCountResponseSchema = z.object({
  read: z.number().describe('Read notification count'),
  unread: z.number().describe('Unread notification count'),
  all: z.number().describe('All notification count')
});

export const notificationApiResponseSchema = (schema: z.Schema) => {
  return z.object({
    status: z.number().describe('API response status'),
    data: schema,
    message: z.string().describe('API response message')
  });
};

export const deleteUserNotificationRequestSchema = z.object({
  notificationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification id')
    .describe('The id of notification to be deleted'),
  userId: z.number().describe('User Id')
});

export const getNotificationToUserByUserRequestSchema = z.object({
  user_id: z.number().describe('User id.'),
  user_type: z.number().describe('User type.'),
  type: z.string().optional().describe('type of data expected'),
  communication_master_id: z.string().optional().describe('communication_master_id'),
  limit: z.number().describe('data limiy'),
  page: z.number().describe('page number'),
  mode: z.string().optional().describe('mode')
});

export class GetNotificationsByPortalIdRequestQuery extends createZodDto(
  getNotificationsByPortalIdRequestQuerySchema
) {}

export class Notification extends createZodDto(notificationSchema) {}

export class SendNotificationRequest extends createZodDto(sendNotificationRequestSchema) {}

export class CreateNotificationRequest extends createZodDto(createNotificationRequestSchema) {}

export class SendNotificationResponse extends createZodDto(
  notificationApiResponseSchema(z.object({}))
) {}

export class PaginatedRequestQueryString extends createZodDto(paginationRequestQuerySchema) {}

export class MarkNotificationsAsReadRequestSchema extends createZodDto(
  markNotificationsAsReadRequestSchema
) {}

export class PaginatedNotificationResponse extends createZodDto(
  notificationApiResponseSchema(paginatedNotificationResponseSchema)
) {}

export class AvailablePortalResponse extends createZodDto(
  notificationApiResponseSchema(availablePortalResponseSchema)
) {}

export class ActivePortalResponse extends createZodDto(
  notificationApiResponseSchema(activePortalResponseSchema)
) {}

export class PortalDetailResponse extends createZodDto(
  notificationApiResponseSchema(portalDetailResponseSchema)
) {}

export class MarkNotificationAsReadResponse extends createZodDto(
  notificationApiResponseSchema(z.object({}))
) {}

export class ReadCountRequest extends createZodDto(readCountRequestSchema) {}

export class ReadCountResponse extends createZodDto(
  notificationApiResponseSchema(readCountResponseSchema)
) {}

export class CreateNotificationResponse extends createZodDto(
  notificationApiResponseSchema(z.object({}))
) {}

export class DeleteUserNotificationRequest extends createZodDto(
  deleteUserNotificationRequestSchema
) {}

export class DeleteUserNotificationResponse extends createZodDto(
  notificationApiResponseSchema(z.object({}))
) {}

export class getNotificationToUserByUserRequest extends createZodDto(
  getNotificationToUserByUserRequestSchema
) {}
