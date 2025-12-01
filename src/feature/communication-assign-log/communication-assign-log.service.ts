import { Injectable } from '@nestjs/common';
import { CommunicationAssignLogRepository } from './communication-assign-log.repository';
import { CreateCommunicationAssignLogDto } from './dto/create-communication-assign-log.dto';

@Injectable()
export class CommunicationAssignLogService {
  constructor(private readonly assignLogRepository: CommunicationAssignLogRepository) {}

  create(createAssignLogDto: CreateCommunicationAssignLogDto) {
    return this.assignLogRepository.create(createAssignLogDto);
  }

  findAll() {
    return this.assignLogRepository.findAll();
  }

  async findByCommunicationId(communication_id: string) {
    return this.assignLogRepository.findByCommunicationId(communication_id);
  }

  findById(id: string) {
    return this.assignLogRepository.findById(id);
  }

  update(id: string, updateDto: Partial<CreateCommunicationAssignLogDto>) {
    return this.assignLogRepository.update(id, updateDto);
  }

  delete(id: string) {
    return this.assignLogRepository.delete(id);
  }
}
