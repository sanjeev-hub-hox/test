import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import {
  CommunicationAssignLog,
  CommunicationAssignLogDocument
} from './communication-assign-log.schema';
import { CreateCommunicationAssignLogDto } from './dto/create-communication-assign-log.dto';

@Injectable()
export class CommunicationAssignLogRepository {
  constructor(
    @InjectModel(CommunicationAssignLog.name)
    private readonly communicationAssignLogModel: Model<CommunicationAssignLogDocument>
  ) {}

  async create(
    createAssignLogDto: CreateCommunicationAssignLogDto
  ): Promise<CommunicationAssignLog> {
    const newAssignLog = new this.communicationAssignLogModel(createAssignLogDto);
    return newAssignLog.save();
  }

  async findAll(): Promise<CommunicationAssignLog[]> {
    return this.communicationAssignLogModel.find().exec();
  }

  async findByCommunicationId(communication_id: string): Promise<CommunicationAssignLog[]> {
    return this.communicationAssignLogModel.find({ communication_id }).exec();
  }

  async findById(id: string): Promise<CommunicationAssignLog> {
    return this.communicationAssignLogModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: Partial<CreateCommunicationAssignLogDto>
  ): Promise<CommunicationAssignLog> {
    return this.communicationAssignLogModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async delete(id: string): Promise<any> {
    return this.communicationAssignLogModel.findByIdAndDelete(id).exec();
  }
}
