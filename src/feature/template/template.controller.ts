import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UsePipes
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { LoggerService, ResponseService, TEMPLATE_CONFIG } from '../../utils';
import { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import {
  AddTemplateChannelRequest,
  AddTemplateChannelResponse,
  CheckSlugUniquenessResponse,
  CloneTemplateResponse,
  CreateTemplateRequest,
  CreateTemplateResponse,
  EditTemplateRequest,
  EditTemplateResponse,
  GetTemplateChannelDetailsResponseSchema,
  GetTemplateConfigResponse,
  ListTemplateRequest,
  ListTemplateResponse,
  RemoveTemplateChannelRequest,
  RemoveTemplateChannelResponse,
  createTemplateRequestSchema,
  editTemplateRequestSchema,
  listTemplateRequestSchema
} from './template.dto';
import { RequestValidationError } from '../../middleware';
import { ZodValidationPipe } from '../../validation/zodValidation.pipe';
import { RegexValidationPipe } from '../../validation/regexValidation.pipe';
@ApiTags('Template APIs')
@Controller('template')
export class TemplateController {
  constructor(
    private templateService: TemplateService,
    private loggerService: LoggerService,
    private responseService: ResponseService
  ) {}

  @Post('create')
  @ApiCreatedResponse({
    description: 'Success response',
    type: CreateTemplateResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @UsePipes(new ZodValidationPipe(createTemplateRequestSchema))
  async createTemplate(@Res() res: Response, @Body() body: CreateTemplateRequest) {
    try {
      this.loggerService.log(`Create template API payload : ${JSON.stringify(body)}`);
      const template = await this.templateService.createTemplate(body);
      delete template.__v;
      return this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        template,
        'Template created created'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Post('clone/:templateId')
  @ApiCreatedResponse({
    description: 'Success response',
    type: CloneTemplateResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'templateId', required: true, type: String })
  @UsePipes(new RegexValidationPipe(/^[0-9a-fA-F]{24}$/))
  async cloneTemplate(@Res() res: Response, @Param('templateId') templateId: string) {
    try {
      this.loggerService.log(`Clone template API payload : templateId - ${templateId}`);
      const clonedTemplate = await this.templateService.cloneTemplate(templateId);
      return this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        clonedTemplate,
        'Template cloned'
      );
    } catch (err) {
      throw err;
    }
  }

  @Post('edit/:templateId')
  @ApiOkResponse({
    description: 'Success response',
    type: EditTemplateResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'templateId', required: true, type: String })
  async editTemplate(
    @Res() res: Response,
    @Param('templateId', new RegexValidationPipe(/^[0-9a-fA-F]{24}$/)) templateId: string,
    @Body(new ZodValidationPipe(editTemplateRequestSchema)) reqBody: EditTemplateRequest
  ) {
    try {
      const updateResult = await this.templateService.editTemplate(templateId, reqBody);
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        {},
        updateResult.modifiedCount ? 'Template updated' : 'Template not updated'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Post(':templateId/channel/add')
  @ApiOkResponse({
    description: 'Success response',
    type: AddTemplateChannelResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'templateId', required: true, type: String })
  async addTemplateChannel(
    @Res() res: Response,
    @Param('templateId', new RegexValidationPipe(/^[0-9a-fA-F]{24}$/)) templateId: string,
    @Body() reqBody: AddTemplateChannelRequest
  ) {
    try {
      const updateResult = await this.templateService.editTemplateChannel(
        'add',
        templateId,
        reqBody
      );
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        {},
        updateResult.modifiedCount ? 'Template channnel added' : 'Template channel not added'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Post(':templateId/channel/remove')
  @ApiOkResponse({
    description: 'Success response',
    type: RemoveTemplateChannelResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'templateId', required: true, type: String })
  async removeTemplateChannel(
    @Res() res: Response,
    @Param('templateId', new RegexValidationPipe(/^[0-9a-fA-F]{24}$/)) templateId: string,
    @Body() reqBody: RemoveTemplateChannelRequest
  ) {
    try {
      const updateResult = await this.templateService.editTemplateChannel(
        'remove',
        templateId,
        reqBody
      );
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        {},
        updateResult.modifiedCount ? 'Template channnel removed' : 'Template channel not removed'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Get('list')
  @ApiOkResponse({
    description: 'Success response',
    type: ListTemplateResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiQuery({ name: 'templateId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'slug', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'delete', required: false, type: Boolean })
  @ApiQuery({ name: 'pageNumber', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  async listTemplates(
    @Res() res: Response,
    @Query(new ZodValidationPipe(listTemplateRequestSchema)) queryString: ListTemplateRequest
  ) {
    try {
      this.loggerService.log('List template API called');
      const templateList = await this.templateService.getTemplateList(queryString);
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        templateList,
        'Template list found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Get(':templateId/channel/:channel')
  @ApiOkResponse({
    description: 'Success response',
    type: GetTemplateChannelDetailsResponseSchema
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'templateId', required: true, type: String })
  @ApiParam({ name: 'channel', required: true, type: String })
  async getTemplateChannelDetails(
    @Res() res: Response,
    @Param('templateId', new RegexValidationPipe(/^[0-9a-fA-F]{24}$/)) templateId: string,
    @Param('channel') channel: string
  ) {
    try {
      this.loggerService.log('Get channel Details API');
      const templateData = await this.templateService.getTemplateChannelDetails(
        templateId,
        channel
      );
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        templateData,
        'Template channel data found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Post('check-slug/:slug')
  @ApiOkResponse({
    description: 'Success response',
    type: CheckSlugUniquenessResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  @ApiParam({ name: 'slug', required: true, type: String })
  async checkTemplateSlugUniqueness(@Res() res: Response, @Param('slug') slug: string) {
    try {
      const isSlugUnique = await this.templateService.checkSlugUniqueness(slug);
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        {
          unique: isSlugUnique
        },
        isSlugUnique ? 'Template slug is unique' : 'Template slug already exists'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Get('config')
  @ApiOkResponse({
    description: 'Success response',
    type: GetTemplateConfigResponse
  })
  @ApiBadRequestResponse({
    description: 'Validation error response',
    type: RequestValidationError
  })
  async getTemplateConfig(@Res() res: Response) {
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      TEMPLATE_CONFIG,
      'Template configurations'
    );
  }
}
