import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from 'ampersand-common-module';

@Injectable()
export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async create(payload) {
    return await this.auditLogRepository.create(payload);
  }

  async list(page: number, size: number) {
    return await this.auditLogRepository.getMany({}, page, size, 'desc');
  }

  async listFiltered(page: number, size: number, url?: string, recordId?: string) {
    const filter: any = {};

    if (url) {
      filter.url = {
        $in: url.split(',')
      };
    }

    if (recordId) {
      filter.record_id = recordId;
    }

    return await this.auditLogRepository.getMany(filter, page, size, 'desc');
  }
}
