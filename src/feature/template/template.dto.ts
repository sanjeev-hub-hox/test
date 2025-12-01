import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';
import { ETemplateType, ETemplateChannel } from './template.type';

export const createTemplateRequestSchema = z.object({
  type: z
    .enum([ETemplateType.notification, ETemplateType.reminder])
    .describe("Type of a template, possible values are 'reminder', 'notification'"),
  slug: z.string().describe('Slug name of a template'),
  name: z.string().describe('Name of this template'),
  channels: z
    .array(
      z.object({
        channel_template_id: z.string().optional().describe('Slug name of a template'),
        name: z
          .enum([
            ETemplateChannel.email,
            ETemplateChannel.inApp,
            ETemplateChannel.sms,
            ETemplateChannel.whatsapp
          ])
          .describe('The name of the channel for which this template will be used'),
        template_data: z
          .object({
            subject: z.string().optional().describe('The subject of this channel template'),
            body: z.string().optional().describe('The body of this channel template'),
            link: z.string().optional().describe('The link of this channel template'),
            variables: z
              .array(z.string())
              .optional()
              .describe('The variables used in this template')
          })
          .strict()
          .describe('The data which will be used while sending a notification')
      })
    )
    .min(1)
    .describe('List of channels registered against this template')
    .refine((data) => {
      const errors = [];
      let isError = false;
      data.forEach((channel, index) => {
        switch (channel.name) {
          case ETemplateChannel.email:
            if (!channel.template_data.body || !channel.template_data.subject) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'subject, body fields are missing for In-app channel in template_data'
              });
            }
            break;
          case ETemplateChannel.sms:
            if (!channel.template_data.body) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'body field is missing for SMS channel in template_data'
              });
            }
            break;
          case ETemplateChannel.inApp:
            if (!channel.template_data.body || !channel.template_data.subject) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'subject, body fields are missing for In-app channel in template_data'
              });
            }
          case ETemplateChannel.whatsapp:
            isError = true;
            break;
        }
      });
      if (isError) throw { errors };
      return true;
    })
});

export const createTemplateResponseSchema = z.object({
  template_id: z
    .string()
    .describe('A random Id generated against this template which can be used for displaying'),
  type: z
    .enum([ETemplateType.notification, ETemplateType.reminder])
    .describe("Type of a template, possible values are 'reminder', 'notification'"),
  slug: z.string().describe('Slug name of a template'),
  name: z.string().describe('Name of this template'),
  channels: z
    .array(
      z.object({
        name: z.string().describe('The name of the channel for which this template will be used'),
        template_data: z
          .object({
            subject: z.string().optional().describe('The subject of this channel template'),
            body: z.string().optional().describe('The body of this channel template'),
            link: z.string().optional().describe('The link of this channel template'),
            variables: z
              .array(z.string())
              .optional()
              .describe('The variables used in this template')
          })
          .describe('The data which will be used while sending a notification')
      })
    )
    .min(1)
    .describe('List of channels registered against this template'),
  is_active: z.boolean().describe('Active status of this template'),
  is_deleted: z.boolean().describe('Deletion status of this template'),
  created_at: z.string().describe('Template creation date time'),
  updated_at: z.string().describe('Template updation date time')
});

export const editTemplateRequestSchema = z.object({
  name: z.string().describe('Name of this template'),
  slug: z.string().optional().describe('Slug name of a template'),
  channels: z
    .array(
      z.object({
        name: z
          .enum([
            ETemplateChannel.email,
            ETemplateChannel.inApp,
            ETemplateChannel.sms,
            ETemplateChannel.whatsapp
          ])
          .describe('The name of the channel for which this template will be used'),
        template_data: z
          .object({
            subject: z.string().optional().describe('The subject of this channel template'),
            body: z.string().optional().describe('The body of this channel template'),
            link: z.string().optional().describe('The link of this channel template'),
            variables: z
              .array(z.string())
              .optional()
              .describe('The variables used in this template')
          })
          .strict()
          .describe('The data which will be used while sending a notification')
      })
    )
    .min(1)
    .describe('List of channels registered against this template')
    .refine((data) => {
      const errors = [];
      let isError = false;
      data.forEach((channel, index) => {
        switch (channel.name) {
          case ETemplateChannel.email:
            if (!channel.template_data.body || !channel.template_data.subject) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'subject, body fields are missing for In-app channel in template_data'
              });
            }
            break;
          case ETemplateChannel.sms:
            if (!channel.template_data.body) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'body field is missing for SMS channel in template_data'
              });
            }
            break;
          case ETemplateChannel.inApp:
            if (!channel.template_data.body || !channel.template_data.subject) {
              isError = true;
              errors.push({
                path: [`channels[${index}].template_data`],
                message: 'subject, body fields are missing for In-app channel in template_data'
              });
            }
          case ETemplateChannel.whatsapp:
            isError = true;
            break;
        }
      });
      if (isError) throw { errors };
      return true;
    })
});

const addTemplateChannelRequestSchema = z
  .object({
    name: z
      .enum([
        ETemplateChannel.email,
        ETemplateChannel.inApp,
        ETemplateChannel.sms,
        ETemplateChannel.whatsapp
      ])
      .describe('The name of the channel for which this template will be used'),
    template_data: z
      .object({
        channel_template_id: z.string().optional().describe('Slug name of a template'),
        subject: z.string().optional().describe('The subject of this channel template'),
        body: z.string().optional().describe('The body of this channel template'),
        link: z.string().optional().describe('The link of this channel template'),
        variables: z.array(z.string()).optional().describe('The variables used in this template')
      })
      .strict()
      .describe('The data which will be used while sending a notification')
  })
  .refine((data) => {
    const errors = [];
    switch (data.name) {
      case ETemplateChannel.email:
        if (!data.template_data.body || !data.template_data.subject) {
          errors.push({
            path: ['template_data'],
            message: 'subject, body fields are missing for In-app channel in template_data'
          });
        }
        break;
      case ETemplateChannel.sms:
        if (!data.template_data.body) {
          errors.push({
            path: ['template_data'],
            message: 'body field is missing for SMS channel in template_data'
          });
        }
        break;
      case ETemplateChannel.inApp:
        if (!data.template_data.body || !data.template_data.subject) {
          errors.push({
            path: ['template_data'],
            message: 'subject, body fields are missing for In-app channel in template_data'
          });
        }
      case ETemplateChannel.whatsapp:
        break;
    }

    throw { errors };
  });

export const removeTemplateChannelRequestSchema = z.object({
  name: z
    .enum([
      ETemplateChannel.email,
      ETemplateChannel.inApp,
      ETemplateChannel.sms,
      ETemplateChannel.whatsapp
    ])
    .describe('The name of the channel for which this template will be used')
});

export const listTemplateRequestSchema = z.object({
  name: z.string().describe('Name of this template'),
  templateId: z.string().optional().describe('The display id of template'),
  type: z.string().optional().describe('The type of template'),
  slug: z.string().optional().describe('The slug of template'),
  active: z.string().optional().describe('The active status of template'),
  delete: z.string().optional().describe('The delete status of template'),
  pageNumber: z.string().describe('Current page number'),
  pageSize: z.string().describe('The amount of data to be shown in a single page'),
  sortBy: z.string().optional().describe('Sorting order, ascending or descending'),
  sort: z.string().optional().describe('Field name on which sorting needs to performed')
});

export const listTemplateResponseSchema = z.object({
  totalCount: z.number().describe('Total count of data that matched the given filters'),
  isNextPage: z.boolean().describe('Flag which indicates if there is data on the next page or not'),
  data: z.array(
    z.object({
      _id: z.string().describe('The DB id of this template'),
      template_id: z.string().describe('The display id of this template'),
      type: z.string().describe('The type of this template'),
      slug: z.string().describe('Slug name for this template'),
      is_active: z.boolean().describe('Flag that indicates the active status of this template'),
      is_deleted: z.boolean().describe('Flag that indicates the delete status of this template'),
      created_at: z.string().describe('The time stamp at which this date was created'),
      channels: z
        .array(z.string())
        .describe('The list of names of channel templates which are present against this template')
    })
  )
});

export const getTemplateChannelDetailsResponseSchema = z.object({
  channel_template_id: z.string().optional().describe('Slug name of a template'),
  name: z
    .enum([
      ETemplateChannel.email,
      ETemplateChannel.inApp,
      ETemplateChannel.sms,
      ETemplateChannel.whatsapp
    ])
    .describe('The name of the channel for which this template will be used'),
  template_data: z
    .object({
      subject: z.string().optional().describe('The subject of this channel template'),
      short_subject: z.string().optional().describe('The short subject of this channel template'),
      body: z.string().optional().describe('The body of this channel template'),
      link: z.string().optional().describe('The link of this channel template'),
      variables: z.array(z.string()).optional().describe('The variables used in this template')
    })
    .strict()
    .describe('The data which will be used while sending a notification')
});

export const checkSlugUniquenessResponseSchema = z.object({
  unique: z.boolean().describe('Flag that indicates the uniqueness of the template slug')
});

export const getTemplateConfigResponseSchema = z.object({
  template_types: z.array(
    z.object({
      value: z.string().describe('The actual value of this template type'),
      display_name: z.string().describe('The display value of this template type')
    })
  ),
  template_channels: z.array(
    z.object({
      value: z.string().describe('The actual value of this template channel'),
      display_name: z.string().describe('The display value of this template channel')
    })
  )
});

const templateApiResponse = (schema: z.Schema) => {
  return z.object({
    status: z.number().describe('API response status code'),
    data: schema,
    message: z.string().describe('APi response message')
  });
};

export class CreateTemplateRequest extends createZodDto(createTemplateRequestSchema) {}

export class CreateTemplateResponse extends createZodDto(
  templateApiResponse(createTemplateResponseSchema)
) {}

export class CloneTemplateResponse extends createZodDto(
  templateApiResponse(createTemplateResponseSchema)
) {}

export class EditTemplateRequest extends createZodDto(editTemplateRequestSchema) {}

export class EditTemplateResponse extends createZodDto(templateApiResponse(z.object({}))) {}

export class AddTemplateChannelRequest extends createZodDto(addTemplateChannelRequestSchema) {}

export class AddTemplateChannelResponse extends createZodDto(templateApiResponse(z.object({}))) {}

export class RemoveTemplateChannelRequest extends createZodDto(
  removeTemplateChannelRequestSchema
) {}

export class RemoveTemplateChannelResponse extends createZodDto(
  templateApiResponse(z.object({}))
) {}

export class ListTemplateRequest extends createZodDto(listTemplateRequestSchema) {}

export class ListTemplateResponse extends createZodDto(
  templateApiResponse(listTemplateResponseSchema)
) {}

export class GetTemplateChannelDetailsResponseSchema extends createZodDto(
  templateApiResponse(getTemplateChannelDetailsResponseSchema)
) {}

export class CheckSlugUniquenessResponse extends createZodDto(
  templateApiResponse(checkSlugUniquenessResponseSchema)
) {}

export class GetTemplateConfigResponse extends createZodDto(
  templateApiResponse(getTemplateConfigResponseSchema)
) {}
