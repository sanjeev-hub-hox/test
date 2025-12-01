import { Injectable } from '@nestjs/common';
import { CommunicationMasterModeRepository } from './communication_master_mode.repository';
import { CommunicationMasterMode } from './communication_master_mode.schema';
import { Types } from 'mongoose';
import { result } from 'lodash';

@Injectable()
export class CommunicationMasterModeService {
  constructor(
    private readonly communicationMasterModeRepository: CommunicationMasterModeRepository
  ) {}

  create(data: Partial<CommunicationMasterMode>): Promise<CommunicationMasterMode> {
    return this.communicationMasterModeRepository.create(data);
  }

  async createMany(data: CommunicationMasterMode[]): Promise<CommunicationMasterMode[]> {
    return await this.communicationMasterModeRepository.createMany(data);
  }

  async updateMany(
    id: string,
    data: CommunicationMasterMode[]
  ): Promise<CommunicationMasterMode[]> {
    await this.communicationMasterModeRepository.removeByCommunicationMasterId(id);
    return await this.communicationMasterModeRepository.createMany(data);
  }

  findAll(): Promise<CommunicationMasterMode[]> {
    return this.communicationMasterModeRepository.findAll();
  }

  async getCommunicationMasterModes(communication_master_id) {
    return this.communicationMasterModeRepository.getCommunicationMasterModes(
      communication_master_id
    );
  }

  async getById(communicationModeId: string) {
    const result = await this.communicationMasterModeRepository.findById(communicationModeId);
    return result;
  }

  // update
  async update(id: string, body) {
    const result = await this.communicationMasterModeRepository.updateById(
      new Types.ObjectId(id),
      body
    );
    return result;
  }
  async getByCommunicationMasterId(id: string) {
    const result = await this.communicationMasterModeRepository.getByCommunicationMasterId(id);
    return result;
  }
}
