import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const notificationTypeSchema = z
  .object({
    typeId: z.number(),
    name: z.string(),
    icon: z.string(),
    color: z.string(),
    isActive: z.boolean(),
    orderNo: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .required();

export const createNotificationTypeRequestSchema = z.object({
  name: z.string().describe("The name of the notification"),
  icon: z.string().describe("The icon of the notification"),
  color: z.string().describe("The color of the notification"),
  isActive: z.boolean().describe("Active status of the notification"),
  orderNo: z.number().describe("The order number of the notification"),
});

export const notificationTypeResponseSchema = z.object({
  typeId: z.number().describe("The id of the notification"),
  name: z.string().describe("The name of the notification"),
  icon: z.string().describe("The icon of the notification"),
  color: z.string().describe("The color of the notification"),
  isActive: z.boolean().describe("Active status of the notification"),
  orderNo: z.number().describe("The order number of the notification"),
  createdAt: z.string().describe("Date time at which this type was created"),
  updatedAt: z.string().describe("Date time at which this type was updated"),
});

export const notificationTypeParamsSchema = z.object({
  tyepId: z.string().describe("Refers to the Id property of the notification"),
});

export const notificationTypeApiResponseSchema = (schema: z.Schema) => {
  return z.object({
    status: z.number().describe('API response status'),
    data: schema,
    message: z.string().describe('API response message')
  });
};

export class NotificationType extends createZodDto(notificationTypeSchema) {}

export class CreateNotificationTypeRequest extends createZodDto(
  createNotificationTypeRequestSchema
) {}

export class CreateNotificationTypeResponse extends createZodDto(
  notificationTypeApiResponseSchema(notificationTypeResponseSchema)
) {}



