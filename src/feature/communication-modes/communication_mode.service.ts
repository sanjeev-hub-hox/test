import { Injectable } from '@nestjs/common';
import { CommunicationModeRepository } from './communication_mode.repository';
import { CommunicationMode } from './communication_mode.schema';

@Injectable()
export class CommunicationModeService {
  constructor(private readonly communicationModeRepository: CommunicationModeRepository) {}

  create(data: Partial<CommunicationMode>): Promise<CommunicationMode> {
    return this.communicationModeRepository.create(data);
  }

  findAll(): Promise<CommunicationMode[]> {
    return this.communicationModeRepository.findAll();
  }

  findOne(id: string): Promise<CommunicationMode> {
    return this.communicationModeRepository.findById(id);
  }
}
