import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { LoggerService, ResponseService } from "../utils";
import { z } from "nestjs-zod/z";
import { createZodDto } from "nestjs-zod";

export const validationErrorSchema = z.object({
  errorCode: z.number(),
  errorMessage: z.string(),
  error: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    })
  ),
});

export class RequestValidationError extends createZodDto(
  validationErrorSchema
) {}

@Catch()
export class ErrorHandler implements ExceptionFilter {
  private responseService: ResponseService;
  private loggerService: LoggerService;
  constructor() {
    this.loggerService = new LoggerService();
    this.responseService = new ResponseService();
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    console.log("This is the exception : ", exception);
    let statusCode: number,
      message: any,
      stack: string,
      cause: string | Record<string, unknown>[] | unknown;
    if (exception instanceof HttpException) {
      console.log(exception);
      statusCode = exception.getStatus();
      message = exception.message;
      stack = exception.stack;
      cause = exception?.cause ?? "";
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Internal server error";
    }

    this.loggerService.error(message, stack);
    this.responseService.errorResponse(response, statusCode, message, cause);
  }
}
