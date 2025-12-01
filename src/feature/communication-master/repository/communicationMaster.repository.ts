import { CommunicationMasterModel, CommunicationMasterDocument } from '../schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TCommunicationMaster } from '../type';
import { Types } from 'mongoose';
import { FilterDto } from '../dto/communicationMaster.dto';

@Injectable()
export class CommunicationMasterRepository {
  constructor(
    @InjectModel('communicationMaster')
    private communicationMasterModel: CommunicationMasterModel
  ) {}

  create(createData: TCommunicationMaster): Promise<CommunicationMasterDocument> {
    return this.communicationMasterModel.create(createData);
  }

  createMany(createDataArray: TCommunicationMaster[]): Promise<CommunicationMasterDocument[]> {
    try {
      return this.communicationMasterModel.insertMany(createDataArray, { ordered: false });
    } catch (error) {
      console.log('Error while bulk uploading communication masters', error);
    }
  }

  async findAll(body: FilterDto) {
    const page = body.page || 1;
    const limit = body.pageSize || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    const {
      search,
      isDraft,
      category_id,
      sub_category_id,
      type,
      sub_type_id,
      slug,
      mode_id,
      from,
      priority_id
    } = body;

    if (isDraft) {
      filter.is_draft = true;
    }

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { sub_category: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    if (slug) {
      filter.slug = slug;
    }
    filter.is_deleted = 0;

    const filters = {
      category_id: category_id,
      sub_category_id: sub_category_id,
      type: type,
      sub_type_id: sub_type_id,
      from: from,
      mode_id: mode_id,
      priority_id: priority_id
    };

    for (const [dbKey, condition] of Object.entries(filters)) {
      if (condition && condition.operation === 'equals' && Array.isArray(condition.value)) {
        filter[dbKey] = {
          $in: condition.value.map((value) => (dbKey !== 'mode_id' ? Number(value) : value))
        };
      }
    }

    // Perform the query and pagination
    const [result, total] = await Promise.all([
      this.communicationMasterModel
        .find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('communication_modes')
        .exec(),
      this.communicationMasterModel.countDocuments(filter)
    ]);

    return {
      data: result,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateById(
    id: Types.ObjectId,
    data: TCommunicationMaster
  ): Promise<CommunicationMasterDocument> {
    const result = await this.communicationMasterModel.findByIdAndUpdate(id, data, { new: true });
    return result;
  }

  async softDelete(id: Types.ObjectId, userEmail: string): Promise<CommunicationMasterDocument> {
    const result = await this.communicationMasterModel.findByIdAndUpdate(
      id,
      { $set: { is_deleted: true, deleted_by: userEmail } },
      { new: true }
    );
    return result;
  }

  async findByCategoryAndSubCategory(
    category_id: string,
    sub_category_id: string,
    id: string,
    mode_id: string[],
    destination?: string
  ): Promise<CommunicationMasterDocument[]> {
    let where = {
      category_id: parseInt(category_id),
      sub_category_id: parseInt(sub_category_id),
      is_deleted: 0,
      $or: [{ is_draft: false }, { is_draft: { $exists: false } }]
    };
    if (id !== undefined) {
      where['_id'] = { $ne: id };
    }
    if (destination !== undefined) {
      where['destination'] = destination;
    }

    let communicationMode = { path: 'communicationMode' };
    if (Array.isArray(mode_id) && mode_id.length > 0) {
      communicationMode['match'] = { mode_of_communication: { $eq: mode_id } };
      const sortedModeIds = mode_id.sort();
      where['mode_id'] = sortedModeIds;
    }

    const data = await this.communicationMasterModel.find(where).exec();

    if (data[0]?.sub_category === 'Other') {
      data[0]['communication_modes'] = [
        {
          _id: '68402601929c1a6e7ccc0840',
          communication_master_id: '68402006929c1a6e7ccc07fa',
          mode_id: '67b6d34d6f289a31d8f832d7',
          subject: '',
          content: '',
          createdAt: '2025-06-04T10:54:57.686Z',
          updatedAt: '2025-06-04T10:54:57.686Z',
          __v: 0,
          communicationMode: [
            {
              _id: '67b6d34d6f289a31d8f832d7',
              mode_of_communication: 'daily_updates'
            }
          ],
          id: '68402601929c1a6e7ccc0840'
        }
      ];
    }
    // const finalData = data.filter((item) => {
    //   if (item['communication_modes']) {
    //     for (const communication_mode of item['communication_modes']) {
    //       if (communication_mode.communicationMode.length > 0) {
    //         return true;
    //       }
    //     }
    //   }
    //   return false;
    // });

    // return finalData;
    return data;
  }

  async validateCategoryAndSubCategory(
    categorySubCategoryCombinationsArr
  ): Promise<CommunicationMasterDocument[]> {
    const where = { $or: categorySubCategoryCombinationsArr, is_deleted: 0 };
    const data = await this.communicationMasterModel.find(where).exec();
    return data;
  }

  async validateSlug(slugArr): Promise<CommunicationMasterDocument[]> {
    const where = { $or: slugArr, is_deleted: 0 };
    const data = await this.communicationMasterModel.find(where).exec();
    return data;
  }

  async findById(id: string): Promise<CommunicationMasterDocument> {
    return this.communicationMasterModel.findById(id).populate('communication_modes').exec();
  }
}
