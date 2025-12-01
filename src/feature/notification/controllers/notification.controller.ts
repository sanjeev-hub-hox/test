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
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { NotificationService, NotificationToUserService } from '../service';
import { CommunicationMasterService } from '../../communication-master/service';
import { LoggerService, ResponseService } from '../../../utils';
import { ZodValidationPipe } from '../../../validation/zodValidation.pipe';
import { TEMPLATES } from '../helper';
import {
  CreateNotificationRequest,
  MarkNotificationsAsReadRequestSchema,
  AvailablePortalResponse,
  ActivePortalResponse,
  PortalDetailResponse,
  MarkNotificationAsReadResponse,
  SendNotificationResponse,
  sendNotificationRequestSchema,
  GetNotificationsByPortalIdRequestQuery,
  readCountRequestSchema,
  ReadCountRequest,
  ReadCountResponse,
  CreateNotificationResponse,
  SendNotificationRequest,
  createNotificationRequestSchema,
  DeleteUserNotificationResponse,
  deleteUserNotificationRequestSchema,
  DeleteUserNotificationRequest,
  getNotificationToUserByUserRequest,
  getNotificationToUserByUserRequestSchema,
  markNotificationsAsReadRequestSchema
} from '../dto';
import { RequestValidationError } from '../../../middleware';
import { HttpException } from '@nestjs/common/exceptions';
import { PORTALS } from '../../../utils';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Notification APIs')
@Controller()
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private notificationToUserService: NotificationToUserService,
    private loggerService: LoggerService,
    private responseService: ResponseService,
    private communicationMasterService: CommunicationMasterService
  ) {}

  /**
   * Send notification
   */

  @Post('send')
  @UsePipes(new ZodValidationPipe(sendNotificationRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: SendNotificationResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async sendNotification(@Body() reqBody: SendNotificationRequest, @Res() res: Response) {
    try {
      let communicationMaster: { [key: string]: any } =
        await this.communicationMasterService.getAll({
          slug: reqBody.slug
        });

      if (communicationMaster.data.length == 0) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.BAD_REQUEST,
          {},
          'Communication not found.'
        );
      }
      reqBody['communicationMaster'] = communicationMaster.data[0];
      this.loggerService.log(`Send env value : ${process.env.SEND_NOTIFICATION}`);
      // send notification
      if ('true' == process.env.SEND_NOTIFICATION) {
        this.loggerService.log(`Send Notification API request body : ${JSON.stringify(reqBody)}`);
        await this.notificationService.sendNotification(reqBody);
      }

      return this.responseService.sendResponse(res, HttpStatus.OK, {}, 'Notification sent');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Create notification
   */
  @Post('create')
  @UsePipes(new ZodValidationPipe(createNotificationRequestSchema))
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response',
    type: CreateNotificationResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async createNotification(@Body() reqBody: CreateNotificationRequest, @Res() res: Response) {
    try {
      this.loggerService.log(`Create Notification API request body : ${JSON.stringify(reqBody)}`);

      let template = {
        subject: reqBody?.subject ?? null,
        body: reqBody?.body ?? null
      };
      // TODO Get the template data from where it is actually stored
      if (reqBody?.slug) {
        template = TEMPLATES.find((template) => template.slug === reqBody.slug);
      }

      await this.notificationService.createNotification({
        ...reqBody,
        template
      });

      this.responseService.sendResponse(res, HttpStatus.CREATED, {}, 'Notification created');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Get notification portals against whom notifications are sent
   */
  @Get('available-portals')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: AvailablePortalResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async getAvailableNotificationPortals(@Req() req: Request, @Res() res: Response) {
    try {
      const allPortals = PORTALS;
      if (!allPortals) {
        throw new HttpException('Notification portals not found', HttpStatus.NOT_FOUND);
      }
      const availablePortals = await this.notificationService.getNotificationCountByPortals();
      if (!availablePortals) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.OK,
          [],
          'No available notifications against any portal'
        );
      }
      const portals = availablePortals.map((availablePortal) => {
        const portaldetails = allPortals.find((portal) => portal.id === availablePortal._id);
        return {
          ...portaldetails,
          count: availablePortal.count
        };
      });

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        portals,
        'Notification portal details found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Get all active notification portals
   */
  @Get('active-portals')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: ActivePortalResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  async getNotificationPortals(@Req() req: Request, @Res() res: Response) {
    try {
      const allPortals = PORTALS;
      if (!allPortals) {
        throw new HttpException('Notification portals not found', HttpStatus.NOT_FOUND);
      }
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        allPortals,
        'Active notification portals found'
      );
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  // /**
  //  * Get all notifications by portal Id in paginated response format
  //  */
  // @Get('portal-notifications/:portalId')
  // @ApiOkResponse({
  //   status: HttpStatus.OK,
  //   description: 'Success response',
  //   type: PortalDetailResponse
  // })
  // @ApiBadRequestResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Validation error',
  //   type: RequestValidationError
  // })
  // @ApiQuery({ name: 'userId', required: true, type: Number })
  // @ApiQuery({ name: 'pageNumber', required: true, type: Number })
  // @ApiQuery({ name: 'pageSize', required: true, type: Number })
  // @ApiQuery({ name: 'sort', required: false, type: String })
  // @ApiQuery({ name: 'sortBy', required: false, type: String })
  // @ApiQuery({ name: 'readType', required: false, type: String })
  // @ApiQuery({ name: 'timeRange', required: false, type: String })
  // @ApiQuery({ name: 'important', required: false, type: String })
  // async getNotificationsByPortalId(
  //   @Res() res: Response,
  //   @Param('portalId', ParseIntPipe) portalId: number,
  //   @Query() queryString: GetNotificationsByPortalIdRequestQuery
  // ) {
  //   try {
  //     const notifications = await this.notificationToUserService.getPortalNotifications(
  //       portalId,
  //       queryString
  //     );

  //     return this.responseService.sendResponse(
  //       res,
  //       HttpStatus.OK,
  //       notifications[0],
  //       notifications[0]?.totalCount ? 'Notifications found' : 'Notification not found'
  //     );
  //   } catch (err: Error | unknown) {
  //     throw err;
  //   }
  // }

  /**
   * Mark notifications as read
   */
  @Post('mark-as-read')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: MarkNotificationAsReadResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @UsePipes(new ZodValidationPipe(markNotificationsAsReadRequestSchema))
  async markNotificationsAsRead(
    @Body() body: MarkNotificationsAsReadRequestSchema,
    @Res() res: Response
  ) {
    try {
      const updateResult = await this.notificationToUserService.markNotificationsAsRead(body);
      if (!updateResult) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.NOT_FOUND,
          {},
          'Notification not updated'
        );
      }
      return this.responseService.sendResponse(res, HttpStatus.OK, {}, 'Notification updated');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get read count against a portal
   */
  @Post('read-count')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: ReadCountResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @UsePipes(new ZodValidationPipe(readCountRequestSchema))
  async getReadCount(@Body() reqBody: ReadCountRequest, @Res() res: Response) {
    try {
      const { portalId, userId } = reqBody;
      const result = await this.notificationService.getReadCount(portalId, userId);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Read count');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  /**
   * Delete user notification
   */
  @Post('delete')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    type: DeleteUserNotificationResponse
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @UsePipes(new ZodValidationPipe(deleteUserNotificationRequestSchema))
  async deleteNotification(@Body() body: DeleteUserNotificationRequest, @Res() res: Response) {
    try {
      const { notificationId, userId } = body;
      // const response = await this.notificationToUserService.deleteUserNotification(
      //   notificationId,
      //   userId
      // );
      // if (!response) {
      //   return this.responseService.sendResponse(
      //     res,
      //     HttpStatus.NOT_FOUND,
      //     {},
      //     'User notification not found'
      //   );
      // }
      return this.responseService.sendResponse(res, HttpStatus.OK, {}, 'User notification deleted');
    } catch (err: Error | unknown) {
      throw err;
    }
  }

  @Post('upload-document')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error'
  })
  @ApiBody({
    description: 'File upload',
    required: true,
    schema: {
      type: 'object',
      required: ['document'],
      properties: {
        document: {
          type: 'binary',
          format: 'binary'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(@UploadedFile() document: Express.Multer.File, @Res() res: Response) {
    if (!document) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        {},
        'document is required.'
      );
    }

    const fileName = await this.notificationService.uploadDocument(document);

    const documentNameArr = document.originalname ? document.originalname.split('_') : [];

    const documentName =
      documentNameArr.length > 1 ? documentNameArr[documentNameArr.length - 1] : documentNameArr[0];

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      { file: fileName, documentName: documentName },
      'file uploaded successfully.'
    );
  }

  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    example: { url: 'string' }
  })
  @Get('download-document/:id')
  async getUploadedDocumentUrl(@Param('id') id: string, download: boolean = true) {
    const signedUrl = await this.notificationService.getUploadedDocumentUrl(id, download);
    return { url: signedUrl };
  }

  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response',
    example: { url: 'string' }
  })
  @UsePipes(new ZodValidationPipe(getNotificationToUserByUserRequestSchema))
  @Post('notification-to-user/by-user')
  async getNotificationToUserByUser(
    @Body() body: getNotificationToUserByUserRequest,
    @Res() res: Response
  ) {
    try {
      let isWebApp = body?.mode === 'Parent Portal';
      let data = await this.notificationToUserService.getUserNotification(
        Number(body.user_id),
        Number(body.user_type),
        body.type,
        body.communication_master_id,
        Number(body.page),
        Number(body.limit),
        isWebApp
      );
      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        data,
        'data fetch successfully.'
      );
    } catch (error) {
      console.log('N_NC_NTUBU_001', error);
    }
  }
  @Post('send-otp')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error'
  })
  async sendOtp(@Body('number', ParseIntPipe) body: number, @Res() res: Response) {
    try {
      const result = await this.notificationService.sendOTP(body);

      return this.responseService.sendResponse(
        res,
        result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
        { data: result.data || null },
        result.message // ✅ message comes from service
      );
    } catch (error) {
      this.loggerService.error('send sms error block:', error);
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal server error while sending OTP.'
      );
    }
  }
  @Post('verify-otp')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Success response'
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error'
  })
  async verifyOtp(
    @Body('number', ParseIntPipe) number: number,
    @Body('otp', ParseIntPipe) otp: number,
    @Res() res: Response
  ) {
    try {
      const result = await this.notificationService.verifyOTP(number, otp);

      return this.responseService.sendResponse(
        res,
        result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
        { data: result.data || null },
        result.message // ✅ message comes from service
      );
    } catch (error) {
      this.loggerService.error('error in verifyOtp:', error);
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal server error while verifying OTP.'
      );
    }
  }
}
