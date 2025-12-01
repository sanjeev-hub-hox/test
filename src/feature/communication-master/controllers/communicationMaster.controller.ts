import {
  Controller,
  Post,
  Get,
  Res,
  HttpStatus,
  Body,
  UsePipes,
  Query,
  Param,
  Req,
  ParseIntPipe,
  Put,
  Delete
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CommunicationMasterService } from '../service';
import {
  LoggerService,
  ResponseService,
  getRandomId,
  TICKET_TOKEN,
  COMMUNICATION_GROUP,
  COMMUNICATION_CATEGORY,
  COMMUNICATION_SUB_CATEGORY,
  COMMUNICATION_SUB_TYPE,
  COMMUNICATION_SUB_SUB_TYPE,
  COMMUNICATION_PRIORITY
} from '../../../utils';
import { ZodValidationPipe } from '../../../validation/zodValidation.pipe';
import {
  CreateCommunicationMasterRequest,
  readCountRequestSchema,
  ReadCountRequest,
  ReadCountResponse,
  CreateCommunicationMasterResponse,
  createCommunicationMasterRequestSchema,
  GetCommunicationMasterRequest,
  UpdateCommunicationMasterRequest,
  FilterDto
} from '../dto';
import { RequestValidationError } from '../../../middleware';
import { HttpException } from '@nestjs/common/exceptions';
import { SearchCommunicationDto } from '../dto/search-communication.dto';
import axios from 'axios';
import * as qs from 'qs';
import { CommunicationMasterModeService } from 'feature/communication-master-modes/communication_master_mode.service';

@ApiTags('Communication Master APIs')
@Controller('communication-master')
export class CommunicationMasterController {
  constructor(
    private communicationMasterService: CommunicationMasterService,
    private communicationMasterModeService: CommunicationMasterModeService,
    private loggerService: LoggerService,
    private responseService: ResponseService
  ) {}

  /**
   * Create Communication Master
   */
  @Post('create')
  @UsePipes(new ZodValidationPipe(createCommunicationMasterRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async createCommunicationMaster(
    @Body() body: CreateCommunicationMasterRequest,
    @Res() res: Response
  ) {
    try {
      const sortedModeIds = body.mode_id.sort();
      let oldData: any = await this.communicationMasterService.findByCategoryAndSubCategory({
        category_id: String(body.category_id),
        sub_category_id: String(body.sub_category_id),
        mode_id: sortedModeIds,
        destination: String(body.destination)
      });

      if (oldData.length > 0) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.BAD_REQUEST,
          {},
          'Category, Sub Category & Mode of Communication combination already exists.'
        );
      }

      const slug = `${body?.category}-${body?.sub_category}-${body?.mode.join('-')}${body?.destination ? '-' + body?.destination : ''}-${new Date()}`;
      body['slug'] = slug;

      // oldData = await this.communicationMasterService.getAll({
      //   slug: body.slug
      // });

      // if (oldData.data.length > 0) {
      //   return this.responseService.sendResponse(
      //     res,
      //     HttpStatus.BAD_REQUEST,
      //     {},
      //     'Slug name already exists.'
      //   );
      // }

      body['mode_id'] = sortedModeIds;
      const result: any = await this.communicationMasterService.create({
        ...body
      });

      // Add record in master modes table
      if (result?._id) {
        for (let modeId of body.mode_id) {
          const communicationMasterMode = {
            communication_master_id: result._id,
            mode_id: String(modeId),
            subject: String(body.subject),
            content: String(body.content)
          };
          const masterMode =
            await this.communicationMasterModeService.create(communicationMasterMode);
        }
      }

      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        result,
        'Communication Master created'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  // Listing Communication Master
  @Post('list')
  // @UsePipes(new ZodValidationPipe(createCommunicationMasterRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Get Communication Master listing ' })
  async getCommunicationMaster(@Body() body: FilterDto, @Res() res: Response) {
    try {
      const result = await this.communicationMasterService.getAll({ ...body });

      let data = {
        data: [],
        meta: result.meta
      };
      let categoryId: number[] = [];
      let category: object[] = [];
      let subCategoryId: number[] = [];
      let subCategory: object[] = [];
      let subTypeId: number[] = [];
      let subType: object[] = [];
      let subSubTypeId: number[] = [];
      let subSubType: object[] = [];
      let priorityId: number[] = [];
      let priority: object[] = [];
      if (result.data.length > 0) {
        for (const i of result.data) {
          if (i.category_id != null && !categoryId.includes(i.category_id)) {
            categoryId.push(i.category_id);
          }
          if (i.sub_category_id != null && !subCategoryId.includes(i.sub_category_id)) {
            subCategoryId.push(i.sub_category_id);
          }
          // if (i.sub_type_id != null && !subTypeId.includes(i.sub_type_id)) {
          //   subTypeId.push(i.sub_type_id);
          // }
          // if (i.sub_sub_type_id != null && !subSubTypeId.includes(i.sub_sub_type_id)) {
          //   subSubTypeId.push(i.sub_sub_type_id);
          // }
          if (i.priority_id != null && !priorityId.includes(i.priority_id)) {
            priorityId.push(i.priority_id);
          }
        }

        [category, subCategory, subType, subSubType, priority] = await Promise.all([
          this.communicationMasterService.getMdmDataByIds(categoryId, COMMUNICATION_CATEGORY),
          this.communicationMasterService.getMdmDataByIds(
            subCategoryId,
            COMMUNICATION_SUB_CATEGORY
          ),
          this.communicationMasterService.getMdmDataByIds(subTypeId, COMMUNICATION_SUB_TYPE),
          this.communicationMasterService.getMdmDataByIds(subSubTypeId, COMMUNICATION_SUB_SUB_TYPE),
          this.communicationMasterService.getMdmDataByIds(priorityId, COMMUNICATION_PRIORITY)
        ]);

        for (const i in result.data) {
          let val = result.data[i].toObject();
          val = {
            ...val,
            ...{
              category: '--',
              sub_category: '--',
              sub_type: '--',
              sub_sub_type: '--',
              priority: '--'
            }
          };
          if (val['category_id'] != null) {
            let temp = category.find(function (itm) {
              return itm['id'] == val['category_id'];
            });
            if (temp) {
              val['category'] = temp['attributes']['name'];
            }
          }
          if (val['sub_category_id'] != null) {
            let temp = subCategory.find(function (itm) {
              return itm['id'] == val['sub_category_id'];
            });
            if (temp) {
              val['sub_category'] = temp['attributes']['name'];
            }
          }
          if (val['sub_type_id'] != null) {
            let temp = subType.find(function (itm) {
              return itm['id'] == val['sub_type_id'];
            });
            if (temp) {
              val['sub_type'] = temp['attributes']['name'];
            }
          }
          if (val['sub_sub_type_id'] != null) {
            let temp = subCategory.find(function (itm) {
              return itm['id'] == val['sub_sub_type_id'];
            });
            if (temp) {
              val['sub_sub_type'] = temp['attributes']['name'];
            }
          }
          if (val['priority_id'] != null) {
            let temp = priority.find(function (itm) {
              return itm['id'] == val['priority_id'];
            });
            if (temp) {
              val['priority'] = temp['attributes']['priority'];
            }
          }
          data.data[i] = val;
        }
      }
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Communication Master listing');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  // Update Communication Master
  @Put(':id')
  // @UsePipes(new ZodValidationPipe(createCommunicationMasterRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Update Communication Master by Id ' })
  async updateCommunicationMaster(
    @Param('id') id: string,
    @Body() body: UpdateCommunicationMasterRequest,
    @Res() res: Response
  ) {
    try {
      // const oldData = await this.communicationMasterService.findByCategoryAndSubCategory({
      //   category_id: String(body.category_id),
      //   sub_category_id: String(body.sub_category_id),
      //   id: id
      // });

      // if (oldData.length > 0) {
      //   return this.responseService.sendResponse(
      //     res,
      //     HttpStatus.BAD_REQUEST,
      //     {},
      //     'Category & sub category combination already exists.'
      //   );
      // }
      const today = new Date();

      const result = await this.communicationMasterService.update(id, {
        ...body,
        updated_at: today
      });

      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Communication Master updated');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Get communication by id
   */
  @Get('/:communicationId')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async getCommunicationMasterId(
    @Res() res: Response,
    @Param('communicationId') communicationId: string
  ) {
    try {
      const communicationMaster = await this.communicationMasterService.getById(communicationId);

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        communicationMaster,
        communicationMaster != null ? 'Communication Masters found' : 'Data Not Found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  // Soft Delete Communication Master
  @Put('soft-delete/:id')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Soft Delete Communication Master by Id ' })
  async softDeleteCommunicationMaster(
    @Param('id') id: string,
    @Body('userEmail') userEmail: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.communicationMasterService.softDelete(id, userEmail);

      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'Communication Master soft deleted'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  // Bulk Upload Communication Master
  @Post('bulk-upload')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: CreateCommunicationMasterResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Bulk Upload Communication Master' })
  async bulkUploadCommunicationMaster(
    @Body() body: CreateCommunicationMasterRequest[],
    @Res() res: Response
  ) {
    // 0. Validate record limit
    if (!Array.isArray(body) || body.length === 0) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        {},
        'Request body must contain at least one record.'
      );
    }

    if (body.length > 100) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        {},
        'You cannot upload more than 100 records at once.'
      );
    }

    // 1. Validate Category and Sub Category combination
    const categorySubCategoryCombinationsArr: any = body.map((master: any) => ({
      category_id: String(master?.category_id),
      sub_category_id: String(master?.sub_category_id),
      mode: String(master?.mode)
    }));

    const categorySubCategoryCombinations: any =
      await this.communicationMasterService.validateCategoryAndSubCategory(
        categorySubCategoryCombinationsArr
      );
    if (categorySubCategoryCombinations.length > 0) {
      // 1.1 Return combination already exists error response if exists
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        categorySubCategoryCombinations,
        'Category, Sub category and Mode combination already exists.'
      );
    }

    for (const i in body) {
      if (body[i]?.slug != null || !body[i]?.slug) {
        const slug = `${body[i]?.category}-${body[i]?.sub_category}-${body[i]?.mode}${body[i]?.destination ? '-' + body[i]?.destination : ''}-${new Date()}`;
        body[i]['slug'] = slug;
      }
    }
    // const slug: any = await this.communicationMasterService.validateSlug(slugArr);
    // if (slug.length > 0) {
    //   // 2.1 Return slug name already exists error response if exists
    //   return this.responseService.sendResponse(
    //     res,
    //     HttpStatus.BAD_REQUEST,
    //     slug,
    //     'Slug already exists.'
    //   );
    // }

    // 3. Create Communication Master
    const result = await this.communicationMasterService.createMany(body);

    // 4. Update Communication Master Modes Table as well
    for (let master of result) {
      if (master?._id) {
        const communicationMasterMode = {
          communication_master_id: String(master._id),
          mode_id: String(master?.mode_id),
          subject: String(master?.subject),
          content: String(master?.content)
        };

        const masterMode =
          await this.communicationMasterModeService.create(communicationMasterMode);
      }
    }

    // 5. Return success response
    this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Bulk upload of Communication Master successful'
    );
  }

  @Post('find-by-category-subcategory')
  async findByCategoryAndSubCategory(
    @Body() searchDto: SearchCommunicationDto,
    @Res() res: Response
  ) {
    const result = await this.communicationMasterService.findByCategoryAndSubCategory(searchDto);

    // let groupId: number[] = [];
    // for (const i of result) {
    //   if (i.group_id.length > 0) {
    //     groupId = [...groupId, ...i.group_id];
    //   }
    // }

    // let group = [];
    // if (groupId.length > 0) {
    //   const queryString = qs.stringify(
    //     { filters: { id: { $in: groupId } } },
    //     { encodeValuesOnly: true }
    //   );
    //   let mdmData = await axios.get(`${COMMUNICATION_GROUP}?${queryString}`, {
    //     headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
    //   });
    //   mdmData = mdmData['data'];
    //   if (mdmData['data'] != null) {
    //     group = mdmData['data'];
    //   }
    // }

    // for (const i in result) {
    //   let val = result[i];
    //   let groups = [];
    //   for (const j of val.group_id) {
    //     let temp = group.find(function (itm) {
    //       return itm.id == j;
    //     });
    //     if (temp) {
    //       groups.push(temp);
    //     }
    //   }
    //   result[i].group_id = groups;
    // }

    this.responseService.sendResponse(res, HttpStatus.OK, result, 'Data fetched successfully');
  }

  @Get('find-by-group-id/:groupId')
  async findByGroupId(@Res() res: Response, @Param('groupId') groupId: number) {
    const getuserIdData = await this.communicationMasterService.getUserByGroupId(groupId);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      getuserIdData,
      'Data fetched successfully'
    );
  }

  // async getMdmDataByIds(ids: number[], URL: string) {
  //   let data = [];
  //   if (ids.length > 0) {
  //     const queryString = qs.stringify(
  //       { filters: { id: { $in: ids } } },
  //       { encodeValuesOnly: true }
  //     );
  //     let mdmData = await axios.get(`${URL}?${queryString}`, {
  //       headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
  //     });
  //     mdmData = mdmData['data'];
  //     if (mdmData['data'] != null || mdmData['data'].length != 0) {
  //       data = mdmData['data'];
  //     }
  //   }
  //   return data;
  // }
}
