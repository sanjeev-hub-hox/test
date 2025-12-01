import {
  Controller,
  Post,
  Res,
  HttpStatus,
  Body,
  UsePipes,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { NotificationTypeService } from '../service';
import { LoggerService, ResponseService, getRandomId } from '../../../utils';
import { ZodValidationPipe } from '../../../validation/zodValidation.pipe';
import {
  createNotificationTypeRequestSchema,
  CreateNotificationTypeRequest,
  CreateNotificationTypeResponse,
} from '../dto';
import { RequestValidationError } from '../../../middleware';

@ApiTags('Notification Type APIs')
@Controller('notification-type')
export class NotificationTypeController {
  constructor(
    private notificationService: NotificationTypeService,
    private loggerService: LoggerService,
    private responseService: ResponseService
  ) {}

  /**
   * Create all the notification types
   */
  @Post('create')
  @UsePipes(new ZodValidationPipe(createNotificationTypeRequestSchema))
  @ApiCreatedResponse({
    status: HttpStatus.CREATED,
    description: 'Notification type created',
    type: CreateNotificationTypeResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async createNotificationType(@Body() body: CreateNotificationTypeRequest, @Res() res: Response) {
    try {
      this.loggerService.log(`Create Notification API request body: ${JSON.stringify(body)} `);
      const response = await this.notificationService.create({
        typeId: getRandomId(),
        ...body
      });
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        response,
        'Notification type created'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }
}
