import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TemplateDocument, TemplateModel } from './template.schema';
import { Types } from 'mongoose';
import { TTemplate } from './template.type';

@Injectable()
export class TemplateRepository {
  constructor(@InjectModel('template') private templateModel: TemplateModel) {}

  getOne(
    filter: Record<string, any>,
    project: Record<string, number> = {}
  ): Promise<TemplateDocument> {
    return this.templateModel.findOne(filter, { __v: 0, _id: 0, ...project });
  }

  create(data: any) {
    return this.templateModel.create(data);
  }

  getById(id: Types.ObjectId): Promise<TemplateDocument> {
    return this.templateModel.findById(id);
  }

  aggregate(pipeline: any[]): Promise<any> {
    return this.templateModel.aggregate(pipeline);
  }

  updateOne(filter: Record<string, any>, payload: Partial<TTemplate>) {
    return this.templateModel.updateOne(filter, payload);
  }

  updateById(id: Types.ObjectId, payload: Partial<TTemplate>) {
    return this.templateModel.findByIdAndUpdate(id, payload, { new: true });
  }
}
