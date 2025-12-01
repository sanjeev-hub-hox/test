import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  HttpStatus,
  Res
} from '@nestjs/common';
import { CommunicationMasterModeService } from './communication_master_mode.service';
import { CommunicationMasterMode } from './communication_master_mode.schema';
import { LoggerService, ResponseService, getRandomId } from '../../utils';
import { ZodValidationPipe } from '../../validation/zodValidation.pipe';
import { Request, Response } from 'express';
import {
  CreateCommunicationMasterModeRequest,
  UpdateCommunicationMasterModeRequest,
  createCommunicationMasterModeRequestSchema,
  createManyCommunicationMasterModeRequestSchema
} from './communication_master_mode.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { RequestValidationError } from '../../middleware';

@Controller('communication-master-modes')
export class CommunicationMasterModeController {
  constructor(
    private readonly communicationMasterModeService: CommunicationMasterModeService,
    private responseService: ResponseService
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createCommunicationMasterModeRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async create(@Body() data: Partial<CommunicationMasterMode>, @Res() res: Response) {
    try {
      const result = await this.communicationMasterModeService.create(data);
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

  @Post('/create-many')
  @UsePipes(new ZodValidationPipe(createManyCommunicationMasterModeRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async createMany(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.communicationMasterModeService.createMany(body.modes);
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        result,
        'Communication Master Modes created'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Put('/create-many/:id')
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async createManyPut(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const result = await this.communicationMasterModeService.updateMany(id, body.modes);
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        result,
        'Communication Master Modes created'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Get()
  findAll(): Promise<CommunicationMasterMode[]> {
    return this.communicationMasterModeService.findAll();
  }

  // Update Communication Master
  @Put(':id')
  // @UsePipes(new ZodValidationPipe(createCommunicationMasterRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Update Communication Master MODE by Id ' })
  async updateCommunicationMaster(
    @Param('id') id: string,
    @Body() body: UpdateCommunicationMasterModeRequest,
    @Res() res: Response
  ) {
    try {
      const result = await this.communicationMasterModeService.update(id, body);

      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Communication Master updated');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Get communication Mode by id
   */
  @Get('/:id')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async getCommunicationMasterId(@Res() res: Response, @Param('id') id: string) {
    try {
      const communicationMaster = await this.communicationMasterModeService.getById(id);

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        communicationMaster,
        communicationMaster != null ? 'Communication Masters Mode found' : 'Data Not Found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }
}
