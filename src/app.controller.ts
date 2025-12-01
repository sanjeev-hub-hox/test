import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('Health check and other APIs')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  HealthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get("favicon.ico")
  ignoreFavIcon(@Res() res: Response) {
    return res.status(200);
  }
}
