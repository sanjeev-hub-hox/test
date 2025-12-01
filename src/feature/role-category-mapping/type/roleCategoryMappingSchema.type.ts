export type TRoleCategoryMapping = {
  hris_unique_role_id?: number;
  hris_unique_role_code: string;
  hris_unique_role?: string;
  category_id: number;
  category?: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
};

export interface IPermissionsInput {
  email: string;
  serviceName: string;
  module: string;
  applicationId?: number;
}
