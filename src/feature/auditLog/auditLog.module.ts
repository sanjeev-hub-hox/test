import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogRepository } from 'ampersand-common-module';
import { AuditLogSchema } from 'ampersand-common-module';

import { LoggerService, ResponseService } from '../../utils';
import { AuditLogController } from './auditLogcontroller';
import { AuditLogService } from './service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'auditLogs', schema: AuditLogSchema }])],
  providers: [ResponseService, LoggerService, ConfigService, AuditLogRepository, AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService, AuditLogRepository]
})
export class AuditLogModule {}
