import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Communication, CommunicationDocument } from './communication.schema';
import { CreateCommunicationDto, CreateAnnouncementDto } from './communication.dto';
import { CommunicationLog } from 'feature/communication-log/communication-log.schema';
import { CommunicationAssignLog } from 'feature/communication-assign-log/communication-assign-log.schema';
import { FilterDto } from './communication.dto';

@Injectable()
export class CommunicationRepository {
  constructor(
    @InjectModel(Communication.name) private communicationModel: Model<CommunicationDocument>
  ) {}

  async create(
    createCommunicationDto: CreateCommunicationDto | CreateAnnouncementDto
  ): Promise<Communication> {
    const createdCommunication = new this.communicationModel(createCommunicationDto);
    return createdCommunication.save();
  }

  async findAll(body: FilterDto, schoolIds?: any) {
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
      created_by,
      student_id,
      assign_to
    } = body;

    if (search) {
      filter.$or = [{ subject: { $regex: search, $options: 'i' } }];
    }

    if (created_by) {
      filter.created_by = String(created_by);
    }

    if (assign_to) {
      filter.$and = [
        { $or: [{ assign_to: String(assign_to) }, { reviewer_id: String(assign_to) }] }
      ];
    }

    if (student_id) {
      filter.student_id = Number(student_id);
    }

    let temp: Record<string, any> = {
      category_id: category_id,
      sub_category_id: sub_category_id,
      type: type,
      sub_type_id: sub_type_id
    };
    if (isDraft) {
      temp.is_draft = true;
    }

    for (const [dbKey, condition] of Object.entries(temp)) {
      if (condition && condition.operation === 'equals' && Array.isArray(condition.value)) {
        filter['communication_master.' + dbKey] = {
          $in: condition.value.map((value) => Number(value))
        };
      } else if (condition) {
        filter['communication_master.' + dbKey] = condition;
      }
    }
    if (schoolIds && schoolIds?.length > 0) {
      filter['school_ids'] = { $exists: true, $in: schoolIds };
    }

    console.log('filter', filter);

    let result: any = await this.communicationModel.aggregate([
      {
        $addFields: {
          communication_master_object_id: {
            $toObjectId: '$communication_master_id'
          },
          id: {
            $toString: '$_id'
          }
        }
      },
      {
        $lookup: {
          from: 'communicationMaster',
          localField: 'communication_master_object_id',
          foreignField: '_id',
          as: 'communication_master'
        }
      },
      {
        $lookup: {
          from: 'communicationlogs',
          localField: 'id',
          foreignField: 'communication_id',
          as: 'communication_logs'
        }
      },
      { $match: filter },
      { $sort: { updated_at: -1 } },
      // { $count: "total_row" },
      {
        $facet: {
          metadata: [{ $count: 'total_row' }],
          data: [
            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 0 } }
          ]
        }
      }
    ]);

    result = result[0];
    let total = 0;
    if (
      result &&
      result['metadata'] &&
      result['metadata'][0] &&
      result['metadata'][0]['total_row']
    ) {
      total = result['metadata'][0]['total_row'];
    }
    result = result['data'];

    return {
      data: result,
      total,
      totalPages: Math.ceil(total / limit)
    };
    // return this.communicationModel
    //   .find()
    //   .populate('communication_logs')
    //   .populate('communication_assign_logs')
    //   .exec();
  }

  async findById(id: string): Promise<Communication> {
    return this.communicationModel.findById(id).populate('communication_logs').exec();
  }

  async findByCommunicationMasterId(communication_master_id: string): Promise<Communication> {
    return this.communicationModel
      .findOne({ communication_master_id: communication_master_id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllByCommunicationMasterId(communication_master_id: string): Promise<Communication[]> {
    return this.communicationModel
      .find({ communication_master_id: communication_master_id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateCommunicationDto: Partial<CreateCommunicationDto>
  ): Promise<Communication> {
    return this.communicationModel
      .findByIdAndUpdate(id, updateCommunicationDto, { new: true })
      .exec();
  }

  async updateMany(filter: any, updateCommunicationDto: Partial<CreateCommunicationDto>) {
    return this.communicationModel.updateMany(filter, updateCommunicationDto);
  }

  async delete(id: string): Promise<Communication> {
    return this.communicationModel.findByIdAndDelete(id).exec();
  }

  async getDetails(id: string): Promise<Communication> {
    return (
      this.communicationModel
        .findOne()
        .where('_id', id)
        // .where('to_type', 1)
        .populate('communication_master')
        .populate('communication_logs')
        // .select([
        //   "ticket_number",
        //   "createdAt",
        //   // "category_id",
        //   // "sub_category_id",
        //   "communication_master_id"
        // ])
        .exec()
    );
  }

  async getByQuery(filter) {
    return this.communicationModel.find(filter).limit(10).lean();
  }
}
