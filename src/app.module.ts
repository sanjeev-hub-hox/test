import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NextFunction, Request, Response } from 'express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { GlobalModule } from './global/global.module';
import { AuditLogModule } from './feature/auditLog/auditLog.module';
import { NotificationModule } from './feature/notification/notification.module';
import { ReminderModule } from './feature/reminders/reminder.module';
import { CronModule } from './feature/crons/cron.module';
import { CommunicationMasterModule } from './feature/communication-master/communicationMaster.module';
import { CommunicationMasterModeModule } from 'feature/communication-master-modes/communication_master_mode.module';
import { CommunicationModeModule } from 'feature/communication-modes/communication_mode.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { SMTPTransport } from 'nodemailer/lib/smtp-transport';
import { CommunicationModule } from 'feature/communication/communication.module';
import { CommunicationLogModule } from 'feature/communication-log/communication-log.module';
import { CommunicationAssignLogModule } from 'feature/communication-assign-log/communication-assign-log.module';
import { AuthorizationMiddlewareFactory } from './middleware/auth/authorizationMiddlewareFactory';
import { AuthenticationMiddleware } from './middleware/auth/authentication.middleware';
import { routes } from './middleware/auth/authorizedRoutes';
import { AUTH_ACTIVE, LoggerService, ResponseService } from './utils';
import { RedisService } from 'ampersand-common-module';
import { RoleCategoryMappingModule } from 'feature/role-category-mapping/roleCategoryMapping.module';
// import { KafkaModule } from 'feature/kafka/kafka.module';
// import { KafkaConsumersService } from 'feature/kafka/consumer/kafka-consumer.service';
// import { KafkaProducerService } from 'feature/kafka/producer/kafka-producer.service';
// import {
//   NotificationMessage,
//   NotificationMessageSchema
// } from 'feature/kafka/schema/notification-message.schema';
// import {
//   NotificationTest,
//   NotificationTestSchema
// } from 'feature/kafka/schema/notification-test.schema';
import { CommunicationFormModule } from 'feature/communication-form/communicationForm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD
        }
      } as SMTPTransport,
      defaults: {
        from: process.env.MAIL_FROM_ADDRESS
      }
      // template: {
      //   dir: join(__dirname, './templates'),
      //   adapter: new HandlebarsAdapter(),
      //   options: {
      //     strict: true,
      //   },
      // },
    }),
    GlobalModule,
    AuditLogModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('PG_HOST'),
        port: configService.get<number>('PG_PORT'),
        username: configService.get<string>('PG_USERNAME'),
        password: configService.get<string>('PG_PASSWORD'),
        database: configService.get<string>('PG_DATABASE'),
        entities: [__dirname + '/**/**/*.entity{.ts,.js}']
        // synchronize: true, // disable this in production
      })
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get<string>('MONGO_USERNAME')}:${configService.get<string>('MONGO_PASSWORD')}@${configService.get<string>('MONGO_HOST')}:${configService.get<string>('MONGO_PORT')}/${configService.get<string>('MONGO_DATABASE')}`
      })
    }),
    NotificationModule,
    ReminderModule,
    // CronModule,
    CommunicationMasterModule,
    CommunicationMasterModeModule,
    CommunicationModeModule,
    ScheduleModule.forRoot(),
    CommunicationModule,
    CommunicationLogModule,
    CommunicationAssignLogModule,
    RoleCategoryMappingModule,
    // KafkaModule,
    CommunicationFormModule
  ],

  controllers: [AppController],
  providers: [AppService, AuthorizationMiddlewareFactory, RedisService]
})
export class AppModule {
  constructor(
    private readonly authorizationMiddlewareFactory: AuthorizationMiddlewareFactory,
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
    private readonly loggerService: LoggerService,
    public readonly redisInstance: RedisService
  ) {}
  configure(consumer: MiddlewareConsumer) {
    if (AUTH_ACTIVE) {
      routes.forEach((route) => {
        const middlewares = [];
        // route.authenticate ? middlewares.push(AuthenticationMiddleware) : '';
        route.authenticate
          ? middlewares.push((req: Request, res: Response, next: NextFunction) => {
              return new AuthenticationMiddleware(
                this.configService,
                this.responseService,
                this.loggerService,
                this.redisInstance
              ).use(req, res, next, { authorize: route.authorize });
            })
          : '';
        route.authorize
          ? middlewares.push(
              this.authorizationMiddlewareFactory.create(route.permissions, this.redisInstance)
            )
          : '';
        if (middlewares.length) {
          consumer.apply(...middlewares).forRoutes({ path: route.path, method: route.method });
        }
      });
    }
  }
}
