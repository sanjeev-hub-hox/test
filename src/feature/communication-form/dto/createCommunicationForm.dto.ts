interface FormData {
  [key: string]: any;
}

export class CreateCommunicationFormDto {
  user_id: number;
  form_id: string;
  slug: string;
  communication_id: string;
  formData: FormData;
}
