import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunicationLog, CommunicationLogDocument } from './communication-log.schema';
import { CreateCommunicationLogDto } from './dto/create-communication-log.dto';

@Injectable()
export class CommunicationLogRepository {
  constructor(
    @InjectModel(CommunicationLog.name)
    private communicationLogModel: Model<CommunicationLogDocument>
  ) {}

  // Create a new communication log
  async create(createCommunicationLogDto: CreateCommunicationLogDto): Promise<CommunicationLog> {
    const newLog = new this.communicationLogModel(createCommunicationLogDto);
    return newLog.save();
  }

  // Find communication logs
  async findAll(): Promise<CommunicationLog[]> {
    return this.communicationLogModel.find().exec();
  }

  async findById(id: string): Promise<CommunicationLog> {
    return this.communicationLogModel.findById(id).exec();
  }

  // Find communication logs by communication_id
  async findByCommunicationId(communication_id: string): Promise<CommunicationLog[]> {
    return this.communicationLogModel.find({ communication_id }).exec();
  }

  // Update communication log by id
  async update(
    id: string,
    updateData: Partial<CreateCommunicationLogDto>
  ): Promise<CommunicationLog> {
    return this.communicationLogModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  // Delete communication log by id
  async delete(id: string): Promise<any> {
    return this.communicationLogModel.findByIdAndDelete(id).exec();
  }
}
