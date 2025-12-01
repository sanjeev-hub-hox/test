import {
    Controller,
    Post,
    Res,
    HttpStatus,
    Body,
    UsePipes,
  } from "@nestjs/common";
  import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiTags,
  } from "@nestjs/swagger";
  import { Response } from "express";
  import { ReminderService } from "./reminder.service";
  import { LoggerService, ResponseService } from "../../utils";
  import { ZodValidationPipe } from "../../validation/zodValidation.pipe";
  import {
    createReminderRequestSchema,
    CreateReminderRequest,
    CreateReminderResponse,
  } from "./reminder.dto";
  import { RequestValidationError } from "../../middleware";
import { TReminder } from "./reminder.type";
import { Types } from "mongoose";
  
  @ApiTags('Reminder APIs')
  @Controller("reminder")
  export class ReminderController {
    constructor(
      private reminderService: ReminderService,
      private loggerService: LoggerService,
      private responseService: ResponseService,
    ) {}
  
    /**
     * Create reminder
     */
    @Post("create")
    @UsePipes(new ZodValidationPipe(createReminderRequestSchema))
    @ApiCreatedResponse({
      status: HttpStatus.CREATED,
      description: "Reminder created",
      type: CreateReminderResponse,
    })
    @ApiBadRequestResponse({
      status: HttpStatus.BAD_REQUEST,
      description: "Validation error",
      type: RequestValidationError,
    })
    async createReminder(
      @Body() body: CreateReminderRequest,
      @Res() res: Response
    ) {
      try {
        this.loggerService.log(
          `Create reminder API request body: ${JSON.stringify(body)}`
        );
        const response = await this.reminderService.create({
          ...body,
          reminder_for_id: new Types.ObjectId(body.reminder_for_id),
          start_date_time: new Date(body.start_date_time),
          end_date_time: new Date(body.end_date_time)
        } as TReminder);
        this.responseService.sendResponse(
          res,
          HttpStatus.CREATED,
          response,
          "Reminder created"
        );
      } catch (err: Error | unknown) {
        throw err;
      }
    }
  }
  