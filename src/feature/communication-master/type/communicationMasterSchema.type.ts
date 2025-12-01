import { Types } from 'mongoose';

export type TCommunicationMaster = {
  _id?: Types.ObjectId;
  category_id?: number;
  category?: string;
  sub_category_id?: number;
  sub_category?: string;
  response?: string;
  priority_id?: number;
  hris?: number;
  group_id?: number[];
  type?: number;
  sub_type_id?: number;
  sub_sub_type_id?: number;
  to_type?: number;
  from_type?: string;
  subject?: string;
  workflow_id?: number;
  dynamic_form_id?: string;
  reviewer_hris?: number;
  tat_value?: number;
  tat_type?: number;
  navigation_instruction?: string;
  navigation_link?: string;
  is_draft?: boolean;
  created_at?: Date;
  updated_at?: Date;
  form_slug?: string;
  destination?: string;
};

export type GetCommunicationMaster = {
  page?: number;
  pageSize?: number;
  isDraft?: boolean;
  search?: string;
  category_id?: object;
  sub_category_id?: object;
  type?: object;
  sub_type_id?: object;
};
