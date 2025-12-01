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

export const createCommunicationMasterModeRequestSchema = z.object({
  communication_master_id: z.string().describe('Communication Master ID'),
  mode_id: z.string().describe('Communication Mode ID'),
  subject: z.string().optional().describe('Subject'),
  content: z.string().optional().describe('Content')
});

export const createManyCommunicationMasterModeRequestSchema = z.object({
  modes: z
    .array(
      z.object({
        communication_master_id: z.string().describe('Communication Master ID'),
        mode_id: z.string().describe('Communication Mode ID'),
        subject: z.string().optional().describe('Subject'),
        content: z.string().optional().describe('Content'),
        createdAt: z.string().optional().describe('Subject'),
        updatedAt: z.string().optional().describe('Content')
      })
    )
    .describe('Multiple data of master mode')
});

export const paginationRequestQuerySchema = z.object({
  pageNumber: z.string().describe('Current page number'),
  pageSize: z.string().describe('The amount of data to be shown in a single page'),
  sortBy: z.string().describe('Sorting order, ascending or descending'),
  sort: z.string().describe('Field name on which sorting needs to performed')
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

export class ReadCountRequest extends createZodDto(readCountRequestSchema) {}

export class ReadCountResponse extends createZodDto(
  communicationMasterApiResponseSchema(readCountResponseSchema)
) {}

export class CreateCommunicationMasterResponse extends createZodDto(
  communicationMasterApiResponseSchema(z.object({}))
) {}

export class CreateCommunicationMasterModeRequest extends createZodDto(
  createCommunicationMasterModeRequestSchema
) {}

export class UpdateCommunicationMasterModeRequest extends createZodDto(
  createCommunicationMasterModeRequestSchema
) {}

export class CreateManyCommunicationMasterModeRequest extends createZodDto(
  createManyCommunicationMasterModeRequestSchema
) {}
