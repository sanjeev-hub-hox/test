import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}
  healthCheck(): string {
    const env = this.configService.get<string>("NODE_ENV");
    return `Healthy env: ${env}`;
  }
}
