import { Injectable } from '@nestjs/common';
import { CommunicationLogRepository } from './communication-log.repository';
import { CreateCommunicationLogDto } from './dto/create-communication-log.dto';

@Injectable()
export class CommunicationLogService {
  constructor(private readonly communicationLogRepository: CommunicationLogRepository) {}

  async create(createCommunicationLogDto: CreateCommunicationLogDto) {
    return this.communicationLogRepository.create(createCommunicationLogDto);
  }

  async findByCommunicationId(communication_id: string) {
    return this.communicationLogRepository.findByCommunicationId(communication_id);
  }

  async findById(id: string) {
    return this.communicationLogRepository.findById(id);
  }

  async findAll() {
    return this.communicationLogRepository.findAll();
  }

  async update(id: string, updateData: Partial<CreateCommunicationLogDto>) {
    return this.communicationLogRepository.update(id, updateData);
  }

  async delete(id: string) {
    return this.communicationLogRepository.delete(id);
  }
}
