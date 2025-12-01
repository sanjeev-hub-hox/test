import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommunicationMasterMode,
  CommunicationMasterModeDocument
} from './communication_master_mode.schema';
import { Types } from 'mongoose';

@Injectable()
export class CommunicationMasterModeRepository {
  constructor(
    @InjectModel(CommunicationMasterMode.name)
    private communicationMasterModeModel: Model<CommunicationMasterModeDocument>
  ) {}

  async create(data: Partial<CommunicationMasterMode>): Promise<CommunicationMasterMode> {
    const newRecord = new this.communicationMasterModeModel(data);
    return newRecord.save();
  }

  async createMany(data: CommunicationMasterMode[]): Promise<CommunicationMasterMode[]> {
    return await this.communicationMasterModeModel.create(data);
  }

  async findAll(): Promise<CommunicationMasterMode[]> {
    return this.communicationMasterModeModel.find().exec();
  }

  async getCommunicationMasterModes(communication_master_id) {
    return await this.communicationMasterModeModel.aggregate([
      {
        $addFields: {
          mode_object_id: {
            $toObjectId: '$mode_id'
          }
        }
      },
      {
        $lookup: {
          from: 'communicationmodes',
          localField: 'mode_object_id',
          foreignField: '_id',
          as: 'communication_mode'
        }
      },
      {
        $match: {
          communication_master_id: String(communication_master_id),
          'communication_mode.mode_of_communication': 'in_app'
        }
      }
    ]);
  }

  async findById(id: string) {
    return this.communicationMasterModeModel.findById(id).exec();
  }

  async updateById(id: Types.ObjectId, data: any) {
    const result = await this.communicationMasterModeModel.findByIdAndUpdate(id, data, {
      new: true
    });
    return result;
  }

  async removeByCommunicationMasterId(id: string) {
    return this.communicationMasterModeModel.deleteMany({ communication_master_id: id });
  }

  async getByCommunicationMasterId(id: string) {
    return this.communicationMasterModeModel.find({ communication_master_id: id }).lean();
  }
}
