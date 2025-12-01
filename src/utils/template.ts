import { HttpException, HttpStatus } from "@nestjs/common";

export const CHANNELS = [
  {
    id: 1,
    name: "whatsapp",
  },
  {
    id: 2,
    name: "email",
  },
  {
    id: 3,
    name: "sms",
  },
];

export const TEMPLATES = [
  {
    id: 1,
    slug: "new-admission",
    subject: "New admission notice",
    body: "This is a test template for sending new admission notification. This template has some placeholders mentioned between double curly braces. Following are some placeholders in this template. Name: {{name}}, Standard: {{standard}}, Division: {{Division}}, Board: {{board}}",
    status: "active",
  },
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
      populatedTemplate.subject = populatedTemplate.subject.replace(
        `{{${name}}}`,
        value
      );
    }
    if (populatedTemplate.body) {
      populatedTemplate.body = populatedTemplate.body.replace(
        `{{${name}}}`,
        value
      );
    }
  }
  console.log("populatedTemplate ---> ", populatedTemplate);
  return populatedTemplate;
}

export function selectTemplateBySlugAndPopulateVariables(
  slug: string,
  variables: { name: string; value: unknown }[]
) {
  const template = TEMPLATES.find((template) => template.slug === slug);
  if (!template) {
    throw new HttpException("Template not found", HttpStatus.NOT_FOUND);
  }

  return {
    template: template,
    templateWithValues: populateTemplateVariables(template, variables),
  };
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
  const existingChannelIds = CHANNELS.map(
    (existingchannel) => existingchannel.id
  );
  const channel = channels.every((channel) => {
    if (!existingChannelIds.includes(channel)) {
      return false;
    }
    return true;
  });

  if (!channel) {
    throw new HttpException("Channel not found", HttpStatus.NOT_FOUND);
  }

  for (const channel of channels) {
    const channelName = CHANNELS.filter(
      (existingChannel) => existingChannel.id === channel
    )[0].name;

    switch (channelName) {
      case "whatsapp":
        return true;
      case "email":
        return true;
      case "sms":
        return true;
    }
  }
  return true;
}
