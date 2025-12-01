import { Controller, Get, Post, Body, Param, Put, Delete, Res, HttpStatus } from '@nestjs/common';
import { CommunicationAssignLogService } from './communication-assign-log.service';
import { CreateCommunicationAssignLogDto } from './dto/create-communication-assign-log.dto';
import { ResponseService } from 'utils';
import { Response } from 'express';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Communication Assign Log')
@Controller('communication-assign-log')
export class CommunicationAssignLogController {
  constructor(
    private readonly assignLogService: CommunicationAssignLogService,
    private responseService: ResponseService
  ) {}

  @Post()
  @ApiBody({
    description: 'Create a new communication assign log',
    type: CreateCommunicationAssignLogDto,
    examples: {
      example1: {
        summary: 'Example of a new communication assign log',
        value: {
          communication_id: '601e9d1e11b26c001c8b4567',
          user_id: 'user123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_draft: false
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Communication Assign Log created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async create(@Body() createAssignLogDto: CreateCommunicationAssignLogDto, @Res() res: Response) {
    let result = await this.assignLogService.create(createAssignLogDto);
    return this.responseService.sendResponse(
      res,
      HttpStatus.CREATED,
      result,
      'Communication Assign Log created'
    );
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Communication Assign Logs fetched successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findAll(@Res() res: Response) {
    let result = await this.assignLogService.findAll();
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Assign Logs fetchedd successfully'
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
    let result = await this.assignLogService.findByCommunicationId(communication_id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Logs fetched successfully'
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Communication Assign Log fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Communication Assign Log not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    let result = await this.assignLogService.findById(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Assign Logs fetched successfully'
    );
  }

  @Put(':id')
  @ApiBody({
    description: 'Update an existing communication assign log',
    type: CreateCommunicationAssignLogDto,
    examples: {
      example1: {
        summary: 'Example of updating communication assign log',
        value: {
          user_id: 'user456',
          updated_at: new Date().toISOString(),
          is_draft: true
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Communication Assign Log updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Communication Assign Log not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async update(
    @Param('id') id: string,
    @Body() updateAssignLogDto: Partial<CreateCommunicationAssignLogDto>,
    @Res() res: Response
  ) {
    await this.assignLogService.update(id, updateAssignLogDto);
    let result = await this.assignLogService.findById(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication Assign Log updated successfully'
    );
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Communication Assign Log deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Communication Assign Log not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.assignLogService.delete(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      null,
      'Communication Assign Log deleted successfully'
    );
  }
}
