import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createRoleCategoryMappingRequestSchema = z.object({
  hris_unique_role_code: z.string().describe('HRIS Unique Role Code'),
  category_ids: z.number().array().describe('Array of Category IDs'),
  is_active: z.union([z.literal(0), z.literal(1)]).describe('Is Active')
});

export const getPermissionsRequestSchema = z.object({
  hrisUniqueRoleCode: z.string().optional().describe('HRIS Unique Role Code'),
  module: z.string().describe('Module (group, master and announcement)'),
  email: z.string().describe('User Email'),
  service: z.string().describe('Service Name'),
  applicationId: z.number().optional().default(1).describe('Application ID')
});

export const roleCategoryMappingApiResponseSchema = (schema: z.Schema) => {
  return z.object({
    status: z.number().describe('API response status'),
    data: schema,
    message: z.string().describe('API response message')
  });
};

export class CreateRoleCategoryMappingResponse extends createZodDto(
  roleCategoryMappingApiResponseSchema(z.object({}))
) {}

export class CreateRoleCategoryMappingRequest extends createZodDto(
  createRoleCategoryMappingRequestSchema
) {}
export class GetPermissionsRequestSchema extends createZodDto(getPermissionsRequestSchema) {}
