const expressSession = require('express-session');
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from './app.module';
import { constants } from './utils';
import helmet from 'helmet';
import { ErrorHandler, RequestHandler } from 'middleware';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
const favicon = require('serve-favicon');

declare global {
  namespace Express {
    interface Request {
      session: any; // Adjust the type according to your session implementation
    }
  }
}

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['log', 'error', 'warn']
    });
    app.enableCors();
    app.use(helmet());
    const root = __dirname.split('/');
    // app.use(favicon(root.splice(0, root.length - 1).join('/') + '/favicon.ico'));
    app.use(favicon(join(__dirname, '..', 'public', 'favicon.ico')));
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setGlobalPrefix('notification');
    const options = new DocumentBuilder()
      .setTitle(constants.SWAGGER_API_NAME)
      .setBasePath(constants.SWAGGER_API_BASE_PATH)
      .setDescription(constants.SWAGGER_API_DESCRIPTION)
      .setVersion(constants.SWAGGER_API_CURRENT_VERSION)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'JWT',
          description: 'Enter JWT token'
        },
        'JWT-auth'
      )
      .build();
    app.use(
      expressSession({
        secret: 'yyk5LZwjEjQuJjrzAMW4ApROWJ72leKv',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 } // 1 hour
      })
    );
    patchNestJsSwagger();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(constants.SWAGGER_API_ROOT, app, document);
    app.useGlobalInterceptors(new RequestHandler());
    app.useGlobalFilters(new ErrorHandler());
    await app.listen(3003);
  } catch (err) {
    console.log('Error caught : ', err);
    throw err;
  }
}
bootstrap();
