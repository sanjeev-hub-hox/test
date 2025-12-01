import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommunicationFormModel } from '../schema/communicationForm.schema';
import { CreateCommunicationFormDto } from '../dto';

@Injectable()
export class CommunicationFormRepository {
  constructor(
    @InjectModel('communicationForm')
    private communicationFormModel: CommunicationFormModel
  ) {}

  async submitForm(formData: CreateCommunicationFormDto) {
    const filter = {
      user_id: formData.user_id,
      form_id: formData.form_id
    };

    const options = {
      new: true,
      upsert: true
    };

    // Perform the upsert operation
    const upsertedSubmission = await this.communicationFormModel.findOneAndUpdate(
      filter,
      formData,
      options
    );

    const errorMessage = 'The form cannot be updated. Please connect with IT Administration Team.';
    return upsertedSubmission ? upsertedSubmission : { errorMessage };
  }

  async findFormData(formData: CreateCommunicationFormDto) {
    const filter = {
      user_id: formData.user_id,
      form_id: formData.form_id,
      isSubmitted: true
    };

    // Perform the upsert operation
    const oldFormData = await this.communicationFormModel.findOne(filter);

    return oldFormData;
  }
}
