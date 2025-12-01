import { ApiProperty, PartialType } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { boolean, z } from 'nestjs-zod/z';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

// Old Validation Schema
// export const createCommunicationMasterRequestSchema = z.object({
//   slug: z.string().describe('Unique Name'),
//   category_id: z.number().describe('Category ID'),
//   category: z.string().describe('Category Description'),
//   sub_category_id: z.number().describe('Sub Category ID'),
//   sub_category: z.string().describe('Sub Category Description'),
//   response: z.string().nullable().optional().describe('Response Data'),
//   priority_id: z.number().nullable().optional().describe('Priority ID'),
//   hris: z.number().nullable().optional().describe('HRIS ID'),
//   group_id: z.array(z.number()).describe('Communication Group ID'),
//   type: z.number().describe('Type ID'),
//   sub_type_id: z.number().nullable().optional().describe('Sub Type ID'),
//   sub_sub_type_id: z.number().optional().describe('Sub Sub Type ID'),
//   to_type: z.number().nullable().optional().describe('To Type ID'),
//   from_type: z.string().optional().describe('From Type'),
//   subject: z.string().optional().describe('Subject'),
//   workflow_id: z.number().nullable().optional().describe('WorkFlow ID'),
//   dynamic_form_id: z.string().nullable().optional().describe('Dynamic Form ID'),
//   reviewer_hris: z.number().nullable().optional().describe('Reviewer HRIS Code'),
//   tat_value: z.number().nullable().optional().describe('Tat Value'),
//   tat_type: z.number().nullable().optional().describe('Tat type'),
//   navigation_instruction: z.string().optional().describe('Navigation Instruction'),
//   navigation_link: z.string().optional().describe('Navigation Link'),
//   is_draft: z.boolean().describe('Is draft'),
//   content: z.string().optional().describe('Content'),
//   assignment_type: z.string().optional().describe('Assignment Type'),
//   is_navigation_applicable: z.boolean().optional().describe('Is Navigation Applicable'),
//   is_notification: z.boolean().optional().describe('Is Inapp Notification'),
//   form_slug: z.string().nullable().optional().describe('Dynamic Form Slug')
// });

export const createCommunicationMasterRequestSchema = z
  .object({
    category_id: z.number().describe('Category ID'),
    category: z.string().describe('Category Description'),
    sub_category_id: z.number().describe('Sub Category ID'),
    sub_category: z.string().describe('Sub Category Description'),
    priority_id: z.number().nullable().optional().describe('Priority ID'),
    subject: z.string().optional().describe('Subject'),
    is_draft: z.boolean().describe('Is draft'),
    content: z.string().optional().describe('Content'),
    from: z.number().nullable().optional().describe('From ID'),
    fromValue: z.string().optional().describe('From Value'),
    mode: z.array(z.string()).describe('Mode'),
    mode_id: z.array(z.string()).describe('Mode ID'),
    destination: z.string().describe('Destination'),
    slug: z.string().optional().describe('Unique Name')
  })
  .superRefine((data, ctx) => {
    if (data.is_draft === false) {
      if (data.subject === undefined || data.subject.trim() === '') {
        ctx.addIssue({
          path: ['subject'],
          code: z.ZodIssueCode.custom,
          message: 'Subject is required to Create Communication Master'
        });
      }
      if (data.content === undefined || data.content.trim() === '') {
        ctx.addIssue({
          path: ['content'],
          code: z.ZodIssueCode.custom,
          message: 'Content is required to Create Communication Master'
        });
      }
      if (data.from === null || data.from === undefined) {
        ctx.addIssue({
          path: ['from'],
          code: z.ZodIssueCode.custom,
          message: 'From ID is required to Create Communication Master'
        });
      }
      console.log('dest-condition', data.destination == undefined || data.destination == '');
      console.log('dest-condition', !data.mode.every((el) => el == 'Email'));
      if (
        (data.destination === undefined || data.destination === '') &&
        !data.mode.every((el) => el === 'Email')
      ) {
        ctx.addIssue({
          path: ['destination'],
          code: z.ZodIssueCode.custom,
          message: 'Destination is required to Create Communication Master'
        });
      }
    }
  });

// const passwordSchema = z.object({
//     password: z.string(),
//     confirmPassword: z.string()
// }).refine(data => data.password === data.confirmPassword, {
//     message: "Passwords must match.",
//     path: ["confirmPassword"] // Pointing the error to a specific field
// });

export const paginationRequestQuerySchema = z.object({
  pageNumber: z.string().describe('Current page number'),
  pageSize: z.string().describe('The amount of data to be shown in a single page'),
  sortBy: z.string().describe('Sorting order, ascending or descending'),
  sort: z.string().describe('Field name on which sorting needs to performed')
});

// export const paginatedNotificationResponseSchema = z.object({
//   totalCount: z.number().describe('total data'),
//   isNextPage: z.boolean().describe('Is next page available'),
//   data: z.array(notificationSchema)
// });

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

export const communicationMasterApiResponseSchema = (schema: z.Schema) => {
  return z.object({
    status: z.number().describe('API response status'),
    data: schema,
    message: z.string().describe('API response message')
  });
};

export class PaginatedRequestQueryString extends createZodDto(paginationRequestQuerySchema) {}

// export class PaginatedNotificationResponse extends createZodDto(
//   communicationMasterApiResponseSchema(paginatedNotificationResponseSchema)
// ) {}

export class ReadCountRequest extends createZodDto(readCountRequestSchema) {}

export class ReadCountResponse extends createZodDto(
  communicationMasterApiResponseSchema(readCountResponseSchema)
) {}

export class CreateCommunicationMasterResponse extends createZodDto(
  communicationMasterApiResponseSchema(z.object({}))
) {}

export class CreateCommunicationMasterRequest extends createZodDto(
  createCommunicationMasterRequestSchema
) {}

export class GetCommunicationMasterRequest {
  @ApiProperty({ type: Number, description: 'Page Size', default: 10 })
  pageSize: number = 10;

  @ApiProperty({ type: Number, description: 'Page', default: 1 })
  page: number = 1;

  @ApiProperty({ type: Boolean, description: 'Draft', default: false })
  is_draft: boolean = false;
}

export class FilterValueDto {
  @ApiProperty({ description: 'Operation to apply', example: 'equals' })
  @IsString()
  operation: string;

  @ApiProperty({
    description: 'Values to filter by',
    type: [String],
    example: [1, 2]
  })
  @IsArray()
  value: [];
}

export class FilterDto {
  @ApiProperty({ type: String, description: 'Search' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ type: Number, description: 'Page Size ' })
  pageSize: number;

  @ApiProperty({ type: Number, description: 'Page' })
  page: number;

  @ApiProperty({ type: Boolean, description: 'Draft', default: false })
  @IsBoolean()
  @IsOptional()
  isDraft: boolean;

  @ApiProperty({ type: String, description: 'Slug', default: false })
  @IsString()
  @IsOptional()
  slug: string;

  @ApiProperty({
    description: 'Category',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  category_id?: FilterValueDto;

  @ApiProperty({
    description: 'Sub Category',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  sub_category_id?: FilterValueDto;

  @ApiProperty({
    description: 'Communication Type',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  type?: FilterValueDto;

  @ApiProperty({
    description: 'Sub Type',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  sub_type_id?: FilterValueDto;

  @ApiProperty({
    description: 'Mode of Communication',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  mode_id?: FilterValueDto;

  @ApiProperty({
    description: 'From',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  from?: FilterValueDto;

  @ApiProperty({
    description: 'Priority',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  priority_id?: FilterValueDto;
}

export class UpdateCommunicationMasterRequest extends createZodDto(
  createCommunicationMasterRequestSchema
) {}
