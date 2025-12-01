import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleCategoryMappingController } from './controllers';
import { RoleCategoryMappingSchema } from './schema/roleCategoryMapping.schema';
import { RoleCategoryMappingRepository } from './repository/roleCategoryMapping.repository';
import { RoleCategoryMappingService } from './service/roleCategoryMapping.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'roleCategoryMapping', schema: RoleCategoryMappingSchema }])
  ],
  providers: [RoleCategoryMappingService, RoleCategoryMappingRepository],
  controllers: [RoleCategoryMappingController],
  exports: [RoleCategoryMappingService, RoleCategoryMappingRepository]
})
export class RoleCategoryMappingModule {}
