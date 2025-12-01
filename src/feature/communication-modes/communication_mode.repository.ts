import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunicationMode, CommunicationModeDocument } from './communication_mode.schema';

@Injectable()
export class CommunicationModeRepository {
  constructor(
    @InjectModel(CommunicationMode.name)
    private communicationModeModel: Model<CommunicationModeDocument>
  ) {}

  async create(data: Partial<CommunicationMode>): Promise<CommunicationMode> {
    const newRecord = new this.communicationModeModel(data);
    return newRecord.save();
  }

  async findAll(): Promise<CommunicationMode[]> {
    return this.communicationModeModel.find({ status: 1 }).exec();
  }

  async findById(id: string): Promise<CommunicationMode> {
    return this.communicationModeModel.findById(id);
  }
}
