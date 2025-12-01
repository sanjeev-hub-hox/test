import { Controller, Post, Get, Res, HttpStatus, Body, Param, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RoleCategoryMappingService } from '../service';
import {
  ADMIN_EMAIL_LIST,
  ADMIN_PERMISSIONS,
  COMMUNICATION_CATEGORY,
  ResponseService
} from '../../../utils';
import { RequestValidationError } from '../../../middleware';
import { TRoleCategoryMapping } from '../type';
import {
  CreateRoleCategoryMappingRequest,
  CreateRoleCategoryMappingResponse,
  GetPermissionsRequestSchema
} from '../dto';

@ApiTags('Role Category Mapping APIs')
@Controller('role-category-mapping')
export class RoleCategoryMappingController {
  constructor(
    private roleCategoryMappingService: RoleCategoryMappingService,
    private responseService: ResponseService
  ) {}

  /**
   * Get Categories Data by HRIS Unique Role Code
   */
  @Get()
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: CreateRoleCategoryMappingResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Fetching Category Data based on HRIS Unique Role Code' })
  async getCategoryData(@Res() res: Response, @Query() query: any) {
    let roleCategoryMappings: any;
    try {
      roleCategoryMappings = await this.roleCategoryMappingService.findByHrisUniqueRoleCode(
        query?.hrisUniqueRoleCode
      );
    } catch (error: Error | unknown) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal Server Error'
      );
    }

    const categoryIds: number[] = roleCategoryMappings.map((mapping) => mapping.category_id);

    try {
      console.debug('Category IDs:', categoryIds);
      console.log('Fetching MDM data for category IDs:', categoryIds);

      const categoryData = await this.roleCategoryMappingService.getMdmDataByIds(
        categoryIds,
        COMMUNICATION_CATEGORY
      );
      console.log('Category data fetched successfully');
      console.debug(`Category data: ${categoryData}`);

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        categoryData,
        'Category data fetched successfully'
      );
    } catch (error: Error | unknown) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal Server Error'
      );
    }
  }

  /**
   * Get User Permissions based on RBAC API
   */
  @Post('/permissions')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: CreateRoleCategoryMappingResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Fetching Category Data based on HRIS Unique Role Code' })
  async getPermissions(@Res() res: Response, @Body() body: GetPermissionsRequestSchema) {
    let roleCategoryMappings: string[] = [];
    let message: string;
    // New RBAC API based Logic for Permissions
    try {
      if (ADMIN_EMAIL_LIST.includes(body?.email)) {
        roleCategoryMappings = ADMIN_PERMISSIONS;
      } else {
        roleCategoryMappings = await this.roleCategoryMappingService.getPermissions({
          email: body?.email,
          serviceName: body?.service,
          module: body?.module,
          applicationId: body?.applicationId || 1
        });
        message = 'Category data fetched successfully';
      }
    } catch (error: Error | unknown) {
      message = 'Internal Server Error';
    }

    return this.responseService.sendResponse(res, HttpStatus.OK, roleCategoryMappings, message);

    // Old MongoDB based Logic for Permissions
    /*
    try {
      roleCategoryMappings = await this.roleCategoryMappingService.findByHrisUniqueRoleCode(
        query?.hrisUniqueRoleCode
      );

      let permissions: string[] = [];
      switch (query?.module) {
        case 'group':
          roleCategoryMappings[0]?.groupCreate && permissions.push('create');
          roleCategoryMappings[0]?.groupEdit && permissions.push('edit');
          roleCategoryMappings[0]?.groupView && permissions.push('view');
          break;
        case 'master':
          roleCategoryMappings[0]?.masterCreate && permissions.push('create');
          roleCategoryMappings[0]?.masterEdit && permissions.push('edit');
          roleCategoryMappings[0]?.masterView && permissions.push('view');
          break;
        case 'announcement':
          roleCategoryMappings[0]?.announcementCreate && permissions.push('create');
          roleCategoryMappings[0]?.announcementEdit && permissions.push('edit');
          roleCategoryMappings[0]?.announcementView && permissions.push('view');
          break;
      }

      console.log('Permissions :- ', permissions);

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        permissions,
        'Category data fetched successfully'
      );
    } catch (error: Error | unknown) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        roleCategoryMappings,
        'Internal Server Error'
      );
    }
      */
  }

  /**
   * Create Role Category Mapping
   */
  @Post('create')
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: CreateRoleCategoryMappingResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Creating Role Category Mapping' })
  async createRoleCategoryMapping(
    @Body() body: CreateRoleCategoryMappingRequest,
    @Res() res: Response
  ) {
    try {
      const result = await this.roleCategoryMappingService.createMapping(body);
      return this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        result,
        'Role Category Mapping created successfully'
      );
    } catch (error: Error | unknown) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal Server Error'
      );
    }
  }
}
