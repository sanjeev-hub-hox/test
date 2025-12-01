import { OtpModel, OtpDocument } from '../schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TOtp } from '../type';

@Injectable()
export class OtpRepository {
  constructor(
    @InjectModel('otp')
    private otpModel: OtpModel
  ) {}

  async create(createData: TOtp): Promise<OtpDocument> {
    return this.otpModel.create(createData);
  }

  async findOne(number: number): Promise<OtpDocument | null> {
    return await this.otpModel.findOne({ number });
  }
  async updateOne(number: number, updateData: Partial<OtpDocument>): Promise<OtpDocument | null> {
    return await this.otpModel.findOneAndUpdate({ number }, { $set: updateData });
  }
  async deleteOne(number: number): Promise<OtpDocument | null> {
    return await this.otpModel.findOneAndDelete({ number });
  }
}
