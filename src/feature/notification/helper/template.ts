import { HttpException, HttpStatus } from '@nestjs/common';
import { TNotificationTemplate } from '../type';

export const CHANNELS = [
  {
    id: 1,
    name: 'whatsapp'
  },
  {
    id: 2,
    name: 'email'
  },
  {
    id: 3,
    name: 'sms'
  }
];

export const TEMPLATES = [
  {
    id: 1,
    slug: 'new-admission',
    subject: 'New admission notice',
    body: 'This is a test template for sending new admission notification. This template has some placeholders mentioned between double curly braces. Following are some placeholders in this template. Name: {{name}}, Standard: {{standard}}, Division: {{Division}}, Board: {{board}}',
    status: 'active'
  }
];

export function populateTemplateVariables(
  template: {
    id?: number;
    slug?: string;
    subject: string;
    body: string;
    status?: string;
  },
  variables: { name: string; value: unknown }[]
) {
  const populatedTemplate = JSON.parse(JSON.stringify(template));
  for (const variable of variables) {
    const { value, name } = variable;
    if (populatedTemplate.subject) {
      populatedTemplate.subject = populatedTemplate.subject.replace(`{{${name}}}`, value);
    }
    if (populatedTemplate.body) {
      populatedTemplate.body = populatedTemplate.body.replace(`{{${name}}}`, value);
    }
  }
  return populatedTemplate;
}

export function selectTemplateBySlugAndPopulateVariables(
  slug: string,
  variables: { name: string; value: unknown }[]
) {
  const template = TEMPLATES.find((template) => template.slug === slug);
  if (!template) {
    throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
  }

  return {
    template: template,
    templateWithValues: populateTemplateVariables(template, variables)
  };
}

export function getTemplateDetails(templateData: {
  slug?: string;
  variables?: { name?: string; value?: any }[];
  subject: string;
  body: string;
}): {
  originalTemplate: TNotificationTemplate;
  populatedTemplate: TNotificationTemplate;
} {
  const { slug, variables, subject, body } = templateData;

  let populatedTemplate: any = {};
  let originalTemplate: any = {};
  if (slug) {
    if (!variables) {
      throw new HttpException('Template variables not passed', HttpStatus.BAD_REQUEST);
    }

    const { template, templateWithValues } = selectTemplateBySlugAndPopulateVariables(
      slug,
      // @ts-ignore
      variables
    );

    populatedTemplate = templateWithValues;
    originalTemplate = template;
  } else {
    if (!subject || !body) {
      throw new HttpException('Subject and body not passed', HttpStatus.BAD_REQUEST);
    }
    populatedTemplate['subject'] = subject;
    populatedTemplate['body'] = body;
  }
  return { originalTemplate, populatedTemplate };
}

export async function sendNotificationToChannel(
  channels: number[],
  template: {
    id?: number;
    slug?: string;
    subject: string;
    body: string;
    status?: string;
  },
  userData: any //TODO: Accept all the data of user which is needed to send the notification
) {
  const existingChannelIds = CHANNELS.map((existingchannel) => existingchannel.id);
  const channel = channels.every((channel) => {
    if (!existingChannelIds.includes(channel)) {
      return false;
    }
    return true;
  });

  if (!channel) {
    throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
  }

  for (const channel of channels) {
    const channelName = CHANNELS.filter((existingChannel) => existingChannel.id === channel)[0]
      .name;

    switch (channelName) {
      case 'whatsapp':
        return true;
      case 'email':
        return true;
      case 'sms':
        return true;
    }
  }
  return true;
}

export async function validateAndPopulateTemplate(incomingChannel: any, templateChannel: any) {
  if (
    (incomingChannel?.variables && !templateChannel.template_data?.variables) ||
    (!incomingChannel?.variables && templateChannel.template_data?.variables) ||
    (!incomingChannel?.variables && !templateChannel.template_data?.variables)
  ) {
    return {
      populuatedBody: templateChannel.template_data.body,
      populatedSubject: templateChannel.template_data.subject
    };
  }

  // Below check is a strict check if we want to check if the user passes the proper variables, if its okay some unknown variable is passed or some variables value is not passed, then remove the below check
  const incomingChannelVariables = incomingChannel.variables.map((variable) => variable.name);
  const templateChannelVariables = templateChannel.template_data.variables;

  const check = incomingChannelVariables.every((incomingChannelVariable) => {
    return templateChannelVariables.includes(incomingChannelVariable);
  });

  if (!check) {
    throw new HttpException('Invalid template variables sent', HttpStatus.BAD_REQUEST);
  }

  // Poulate template data
  const populateTemplateResult = populateTemplateVariables(
    {
      body: templateChannel.template_data.body,
      subject: templateChannel.template_data.subject
    },
    incomingChannel?.variables as { name: string; value: unknown }[]
  );

  return {
    populuatedBody: populateTemplateResult.body,
    populatedSubject: populateTemplateResult.subject
  };
}
