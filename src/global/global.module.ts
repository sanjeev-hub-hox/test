import { Global, Module } from '@nestjs/common';
import { LoggerService, ResponseService, MdmService  } from '../utils';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [LoggerService, ResponseService, MdmService],
  exports: [LoggerService, ResponseService, MdmService],
})
export class GlobalModule {}
