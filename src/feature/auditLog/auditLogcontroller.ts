import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { Response } from 'express';

import { RequestValidationError } from '../../middleware';
import { ResponseService } from '../../utils';
import { LoggerService } from '../../utils';
import { CreateAuditLogDto } from './dto/auditLog.dto';
import { AuditLogService } from './service';

@ApiTags('Audit Log')
@ApiBearerAuth('JWT-auth')
@Controller('auditLog')
export class AuditLogController {
  constructor(
    private auditLogService: AuditLogService,
    private responseService: ResponseService,
    private loggerService: LoggerService
  ) {}

  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.OK,
    description: 'Invalid data validation error response',
    type: RequestValidationError
  })
  @Get('/list')
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'size', required: false, type: String })
  async listAuditLogo(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10
  ) {
    try {
      this.loggerService.log(`audit logs get request`);
      const pageSize = size ? parseInt(size as any, 10) : 10;
      const result = await this.auditLogService.list(page, pageSize);
      this.loggerService.log(`audit logs get successfully.`);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'audit logs found successfully.'
      );
    } catch (err: Error | unknown) {
      this.loggerService.log(`audit logs get error: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.OK,
    description: 'Invalid data validation error response',
    type: RequestValidationError
  })
  @Post('/create')
  async createAuditLogo(@Body() reqBody: CreateAuditLogDto, @Res() res: Response) {
    try {
      this.loggerService.log(`audit log created request: ${JSON.stringify(reqBody)}`);
      const result = await this.auditLogService.create(reqBody);
      this.loggerService.log(`audit log created successfully.`);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'audit log created successfully.'
      );
    } catch (err: Error | unknown) {
      this.loggerService.log(`audit log created error: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.OK,
    description: 'Invalid data validation error response',
    type: RequestValidationError
  })
  @Get('/filtered-list')
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'size', required: false, type: String })
  @ApiQuery({ name: 'url', required: false, type: String })
  @ApiQuery({ name: 'record_id', required: false, type: String })
  async listFilteredAuditLogs(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('url') url?: string,
    @Query('record_id') recordId?: string
  ) {
    try {
      this.loggerService.log(
        `filtered audit logs get request with url: ${url}, record_id: ${recordId}`
      );
      const pageSize = size ? parseInt(size as any, 10) : 10;
      const result = await this.auditLogService.listFiltered(page, pageSize, url, recordId);
      this.loggerService.log(`filtered audit logs get successfully.`);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'filtered audit logs found successfully.'
      );
    } catch (err: Error | unknown) {
      this.loggerService.log(`filtered audit logs get error: ${JSON.stringify(err)}`);
      throw err;
    }
  }
}
