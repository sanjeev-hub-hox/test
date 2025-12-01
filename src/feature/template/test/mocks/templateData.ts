import { Types } from 'mongoose';

export const templateData = [
  {
    _id: new Types.ObjectId('663cba4f26cca33455947641'),
    template_id: 'TEMP-875906',
    type: 'Reminder',
    slug: 'reminder-template',
    channels: [
      {
        name: 'email',
        template_data: {
          subject: 'New admission notice',
          short_subject: 'NEW ADM',
          body: 'This is a test template for sending new admission notification. This template has some placeholders mentioned between double curly braces. Following are some placeholders in this template. Name: {{name}}, Standard: {{standard}}, Division: {{division}}, Board: {{board}}',
          link: 'test link',
          variables: ['name', 'standard', 'division', 'board']
        }
      }
    ],
    is_active: true,
    is_deleted: false,
    created_at: '2024-05-09T11:58:07.841Z',
    updated_at: '2024-05-09T11:58:07.841Z',
    __v: 0
  }
];
