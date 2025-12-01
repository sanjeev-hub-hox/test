import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  RoleCategoryMappingDocument,
  RoleCategoryMappingModel
} from '../schema/roleCategoryMapping.schema';
import { TRoleCategoryMapping } from '../type/roleCategoryMappingSchema.type';

@Injectable()
export class RoleCategoryMappingRepository {
  constructor(
    @InjectModel('roleCategoryMapping')
    private roleCategoryMappingModel: RoleCategoryMappingModel
  ) {}
  async createMapping(mappings: TRoleCategoryMapping[]) {
    const result = await this.roleCategoryMappingModel.insertMany(mappings);
    return result;
  }

  async findByHrisUniqueRoleCode(
    hris_unique_role_code: string
  ): Promise<RoleCategoryMappingDocument[]> {
    return await this.roleCategoryMappingModel
      .find({ hris_unique_role_code })
      .populate('category_id')
      .exec();
  }
}
