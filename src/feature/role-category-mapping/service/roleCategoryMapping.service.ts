import { Injectable, Logger } from '@nestjs/common';
import { RoleCategoryMappingRepository } from '../repository/roleCategoryMapping.repository';
import { IPermissionsInput, TRoleCategoryMapping } from '../type/roleCategoryMappingSchema.type';
import axios from 'axios';
import * as qs from 'qs';
import { RBAC_ROLE_PERMISSIONS, TICKET_TOKEN } from 'utils';
import { CreateRoleCategoryMappingRequest } from '../dto';

@Injectable()
export class RoleCategoryMappingService {
  private readonly logger = new Logger(RoleCategoryMappingService.name);
  constructor(private roleCategoryMappingRepository: RoleCategoryMappingRepository) {}

  private generateCombinations({
    hris_unique_role_code,
    category_ids,
    is_active
  }: CreateRoleCategoryMappingRequest): TRoleCategoryMapping[] {
    const result: TRoleCategoryMapping[] = category_ids.map((categoryId: number) => ({
      hris_unique_role_code: hris_unique_role_code,
      category_id: categoryId,
      is_active: is_active || 1
    }));

    return result;
  }

  async createMapping(createData: CreateRoleCategoryMappingRequest) {
    // 1. Generate combinations of hrisUniqueRoleCode and categoryIds
    const createMappingData: TRoleCategoryMapping[] = this.generateCombinations(createData);

    // 2. store combinations in the database
    try {
      const result = await this.roleCategoryMappingRepository.createMapping(createMappingData);
      console.log('RoleCategoryMapping inserted successfully');

      return result;
    } catch (error) {
      console.error('Error creating RoleCategoryMapping:', error);
    }
  }

  async findByHrisUniqueRoleCode(hrisUniqueRoleCode: string) {
    try {
      console.log('Finding RoleCategoryMapping for hrisUniqueRoleCode:', hrisUniqueRoleCode);
      const mappings =
        await this.roleCategoryMappingRepository.findByHrisUniqueRoleCode(hrisUniqueRoleCode);
      console.log('RoleCategoryMapping found successfully');
      console.debug(`RoleCategoryMapping :- ${mappings}`);

      return mappings;
    } catch (error) {
      console.error(
        `Error finding RoleCategoryMapping for hrisUniqueRoleCode --> ${hrisUniqueRoleCode} with error --> ${error}`
      );
    }
  }

  async getMdmDataByIds(ids: number[], URL: string) {
    let data: any;
    if (ids.length > 0) {
      const queryString = qs.stringify(
        { filters: { id: { $in: ids } } },
        { encodeValuesOnly: true }
      );
      let mdmData = await axios.get(`${URL}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        data = mdmData;
      }
    }
    return data || {};
  }

  async getPermissions(permissionsInput: IPermissionsInput): Promise<any> {
    const { email, serviceName, module, applicationId } = permissionsInput;
    let rbacRolePermissions: any;
    try {
      // 1. Make RBAC API call with user email and service name
      this.logger.log(
        `Fetching permissions for user: ${permissionsInput.email} and service: ${permissionsInput.serviceName}`
      );
      rbacRolePermissions = await axios.post(
        `${RBAC_ROLE_PERMISSIONS}`,
        {
          application_id: applicationId,
          service: serviceName,
          user_email: email
        },
        {
          headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
        }
      );
      this.logger.debug('RBAC Role Permissions response:', rbacRolePermissions?.data?.data);
    } catch (error) {
      this.logger.error('Error fetching permissions from RBAC API:', error);
      return [];
    }

    // 2. Get the Permissions from the response
    if (
      rbacRolePermissions?.data?.data?.permissions &&
      rbacRolePermissions?.data?.data?.permissions.length > 0
    ) {
      this.logger.log('Processing RBAC Role Permissions response');
      const userPermissions = rbacRolePermissions?.data?.data?.permissions;
      this.logger.debug('User Permissions:', userPermissions);

      // 3. Allocate the Permissions based on the module
      let permissions: string[] = [];
      switch (module) {
        case 'group':
          userPermissions.includes('create_communication_group') && permissions.push('create');
          // userPermissions.includes('edit_communication_group') && permissions.push('edit');
          userPermissions.includes('view_communication_group') && permissions.push('view');
          break;
        case 'master':
          userPermissions.includes('create_communication_master') && permissions.push('create');
          // userPermissions.includes('edit_communication_master') && permissions.push('edit');
          userPermissions.includes('view_communication_master') && permissions.push('view');
          break;
        case 'announcement':
          userPermissions.includes('create_communication_announcement') &&
            permissions.push('create');
          // userPermissions.includes('edit_communication_announcement') && permissions.push('edit');
          userPermissions.includes('view_communication_announcement') && permissions.push('view');
          break;
      }

      this.logger.debug('Permissions allocated based on module:', permissions);
      return permissions;
    } else {
      this.logger.error('No permissions found for the user in RBAC response');
      return [];
    }
  }
}
