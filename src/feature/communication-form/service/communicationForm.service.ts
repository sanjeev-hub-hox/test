import { Injectable, Logger } from '@nestjs/common';
import { CommunicationFormRepository } from '../repository/communicationForm.repository';
import { CreateCommunicationFormDto } from '../dto';
import { error } from 'console';

@Injectable()
export class CommunicationFormService {
  private readonly logger = new Logger(CommunicationFormService.name);
  constructor(private communicationFormRepository: CommunicationFormRepository) {}

  async submitForm(formData: CreateCommunicationFormDto) {
    const oldFormData = await this.findFormData(formData);

    if (oldFormData) {
      return {
        errorMessage: 'The form is already submitted!',
        oldFormData: oldFormData
      };
    }

    try {
      this.logger.log('Submitting the form');
      const response = await this.communicationFormRepository.submitForm(formData);
      this.logger.log('Form submitted successfully with response :- ', response);
      return response;
    } catch (error) {
      this.logger.error('Error while submitting the form', error);
      return {
        errorMessage: 'Error while submitting the form'
      };
    }
  }

  async findFormData(formData: CreateCommunicationFormDto) {
    try {
      this.logger.log('Finding the form data with form Details :- ', formData);
      const response = await this.communicationFormRepository.findFormData(formData);
      this.logger.log('Form data found successfully with response :- ', response);
      return response;
    } catch (error) {
      this.logger.error('Error while finding the form data', error);
      return {
        errorMessage: 'Error while finding the form data'
      };
    }
  }
}
