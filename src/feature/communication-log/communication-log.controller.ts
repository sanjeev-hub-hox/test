import { Controller, Get, Post, Put, Delete, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { CommunicationLogService } from './communication-log.service';
import { CreateCommunicationLogDto } from './dto/create-communication-log.dto';
import { ResponseService } from 'utils';
import { Response } from 'express';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationService } from '../notification/service/notification.service';
import { CommunicationService } from '../communication/communication.service';

@ApiTags('Communication Log')
@Controller('communication-log')
export class CommunicationLogController {
  constructor(
    private readonly communicationLogService: CommunicationLogService,
    private responseService: ResponseService,
    private communicationService: CommunicationService,
    private notificationService: NotificationService
  ) {}

  @Post()
  @ApiBody({
    description: 'Create a new communication log',
    type: CreateCommunicationLogDto,
    examples: {
      example1: {
        summary: 'Example of a new communication log',
        value: {
          communication_id: '601e9d1e11b26c001c8b4567', // Reference from communication table
          comment: 'This is a test comment',
          attachment_details: 'link/to/attachment',
          user_id: 'user123',
          status: 'open',
          rating: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_draft: false
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Communication Log created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async create(@Body() createCommunicationLogDto: CreateCommunicationLogDto, @Res() res: Response) {
    createCommunicationLogDto.user_id = createCommunicationLogDto['created_by']['user_id'] ?? 1;
    let result = await this.communicationLogService.create(createCommunicationLogDto);
    // if (['closed', 'reopen'].includes(createCommunicationLogDto.status)) {
    await this.communicationService.update(createCommunicationLogDto.communication_id, {
      status: createCommunicationLogDto.status
    });
    // }

    return this.responseService.sendResponse(
      res,
      HttpStatus.CREATED,
      result,
      'Communication Log created'
    );
  }

  // Get all communications logs
  @Get()
  @ApiResponse({ status: 200, description: 'Communication Logs fetched successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findAll(@Res() res: Response) {
    let result = await this.communicationLogService.findAll();
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Logs fetched successfully'
    );
  }

  @Get('communication/:communication_id')
  @ApiResponse({ status: 200, description: 'Communication Logs fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findByCommunicationId(
    @Param('communication_id') communication_id: string,
    @Res() res: Response
  ) {
    let result = await this.communicationLogService.findByCommunicationId(communication_id);
    result = JSON.parse(JSON.stringify(result));

    for (const i in result) {
      let data = result[i];

      if (data.attachment_details != null && data.attachment_details != '') {
        data['attachment_name'] = data.attachment_details;
        let attachment = await this.notificationService.getUploadedDocumentUrl(
          data.attachment_details
        );
        data.attachment_details = attachment;
      } else {
        data.attachment_details = null;
        data['attachment_name'] = null;
      }
      result[i] = data;
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Logs fetched successfully'
    );
  }

  @Put(':id')
  @ApiBody({
    description: 'Update an existing communication log',
    type: CreateCommunicationLogDto,
    examples: {
      example1: {
        summary: 'Example of updating communication log',
        value: {
          comment: 'Updated test comment',
          attachment_details: 'link/to/updated/attachment',
          user_id: 'user456',
          updated_at: new Date().toISOString(),
          is_draft: true
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Communication Log updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Communication Log not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCommunicationLogDto>,
    @Res() res: Response
  ) {
    await this.communicationLogService.update(id, updateData);
    let result = await this.communicationLogService.findById(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Log updated successfully'
    );
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Communication Log deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Communication Log not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.communicationLogService.delete(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      null,
      'Communication Log deleted successfully'
    );
  }
}
