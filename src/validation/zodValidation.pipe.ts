import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Logger,
  PipeTransform,
} from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (err) {
      Logger.error(err);
      const error = err.errors.map((e: any) => {
        return {
          field: e.path[0],
          message: e.message,
        };
      });
      throw new HttpException("Validation error", HttpStatus.BAD_REQUEST, {
        cause: error,
      });
    }
  }
}
