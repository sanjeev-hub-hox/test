import { CommunicationMasterDocument } from '../schema';
import { CreateCommunicationMasterRequest } from '../dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CommunicationMasterRepository } from '../repository';
import {
  EMAIL_CONFIG,
  LoggerService,
  PORTALS,
  RETRY_THRESHOLD,
  SEND_NOTIFICATION_CHANNELS_WITHOUT_TEMPLATE_SLUG,
  getRandomId,
  COMMUNICATION_GROUP_EMPLOYEE,
  TICKET_TOKEN,
  EMPLOYEE_DETAILS,
  USER_DETAILS
} from '../../../utils';
import { GetCommunicationMaster, TCommunicationMaster } from '../type';
import { TemplateRepository } from '../../template/template.repository';
import { TemplateDocument } from '../../template/template.schema';
import { Types } from 'mongoose';
import { SearchCommunicationDto } from '../dto/search-communication.dto';
import axios from 'axios';
import * as qs from 'qs';

export const chunkArray = (array: any[], size: number): any[][] => {
  const chunks: any[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

@Injectable()
export class CommunicationMasterService {
  constructor(
    private communicationMasterRepository: CommunicationMasterRepository,
    private loggerService: LoggerService
  ) {}

  async create(createData: TCommunicationMaster): Promise<CommunicationMasterDocument> {
    return this.communicationMasterRepository.create(createData);
  }

  async createMany(
    createDataArray: TCommunicationMaster[]
  ): Promise<CommunicationMasterDocument[]> {
    return this.communicationMasterRepository.createMany(createDataArray);
  }

  // get communication master listing
  async getAll(body: any) {
    const page = body.page || 1;
    const limit = body.pageSize || 10;
    const result = await this.communicationMasterRepository.findAll(body);

    return {
      data: result.data,
      meta: {
        pagination: {
          page: page,
          pageSize: limit,
          pageCount: result.totalPages,
          total: result.total
        }
      }
    };
  }

  // update
  async update(id: string, body: TCommunicationMaster): Promise<CommunicationMasterDocument> {
    const result = await this.communicationMasterRepository.updateById(
      new Types.ObjectId(id),
      body
    );
    return result;
  }

  // soft delete
  async softDelete(id: string, userEmail: string): Promise<CommunicationMasterDocument> {
    const result = await this.communicationMasterRepository.softDelete(
      new Types.ObjectId(id),
      userEmail
    );
    return result;
  }

  async getById(communicationId: string) {
    const result = await this.communicationMasterRepository.findById(communicationId);
    return result;
  }

  async findByCategoryAndSubCategory(
    searchDto: SearchCommunicationDto
  ): Promise<CommunicationMasterDocument[]> {
    const { category_id, sub_category_id, id, mode_id, destination } = searchDto;
    const communicationMaster =
      await this.communicationMasterRepository.findByCategoryAndSubCategory(
        category_id,
        sub_category_id,
        id,
        mode_id,
        destination
      );

    return communicationMaster;
  }

  async validateCategoryAndSubCategory(
    categorySubCategoryCombinationsArr
  ): Promise<CommunicationMasterDocument[]> {
    const communicationMaster =
      await this.communicationMasterRepository.validateCategoryAndSubCategory(
        categorySubCategoryCombinationsArr
      );

    return communicationMaster;
  }

  async validateSlug(slugArr): Promise<CommunicationMasterDocument[]> {
    const communicationMaster = await this.communicationMasterRepository.validateSlug(slugArr);

    return communicationMaster;
  }

  async findById(id: string) {
    return this.communicationMasterRepository.findById(id);
  }

  async getMdmDataByIds(ids: number[], URL: string) {
    let data = [];
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
        data = mdmData['data'];
      }
    }
    return data;
  }

  async getMdmDataByIdsChunk(ids: number[], URL: string) {
    const dataByIdChunk = chunkArray(ids, 100);

    const legalEntityApiCalls = dataByIdChunk.map((chunk) => {
      const queryString = qs.stringify(
        { filters: { id: { $in: chunk } } },
        { encodeValuesOnly: true }
      );
      const fullUrl = `${URL}?${queryString}`;

      return axios.get(fullUrl, {
        // params: {
        //   'id[$in]': chunk
        // },
        headers: {
          Authorization: `Bearer ${TICKET_TOKEN}`
        }
      });
    });

    try {
      const responses = await Promise.all(legalEntityApiCalls);
      const allData = responses
        .map((res) => res.data?.data) // Extract the `value` array from each response
        .flat(); // Flatten the array of arrays to a single array
      // .map(item => item.data)       // Extract the `data` property from each item
      // .flat();
      return allData;
    } catch (error) {
      console.error('Error fetching MDM data:', error);
      throw error;
    }
  }

  async getMdmDataByColumn(column: string, ids: number[], URL: string) {
    let data = [];
    if (ids.length > 0 && column != '') {
      const queryString = qs.stringify(
        { filters: { [column]: { $in: ids } } },
        { encodeValuesOnly: true }
      );
      let mdmData = await axios.get(`${URL}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        data = mdmData['data'];
      }
    }
    return data;
  }

  async getMdmDataByStudentId(ids: number[], URL: string) {
    let data = [];
    if (ids.length > 0) {
      let mdmData = await axios.post(
        `${URL}`,
        { student_id: ids },
        { headers: { Authorization: `Bearer ${TICKET_TOKEN}` } }
      );
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        data = mdmData['data'];
      }
    }
    return data;
  }

  async getEmployees(groupId: number) {
    let employeeIds = {};
    let queryString = qs.stringify({ filters: { id: groupId } }, { encodeValuesOnly: true });
    let mdmData = await axios.post(
      `${COMMUNICATION_GROUP_EMPLOYEE}`,
      {
        group_id: [groupId]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + TICKET_TOKEN
        }
      }
    );
    mdmData = mdmData['data'];
    let hrisRoleId = {};
    if (mdmData['data'] != null || mdmData['data'].length != 0) {
      employeeIds = mdmData['data'];
    }

    return employeeIds;
  }

  async processResponse(userIds: any[], url: string) {
    const response = await this.getMdmDataByIdsChunk(userIds, url);
    const users: any[] = [];

    for (let i = 0; i < response.length; i++) {
      const user = response[i];
      users.push({
        id: user?.id,
        firstName: user?.attributes?.first_name,
        email: user?.attributes?.email
      });
    }

    return users;
  }

  async getUserByGroupId(groupId: number) {
    const users: any[] = [];
    let response: any;
    try {
      response = await axios.post(
        `${COMMUNICATION_GROUP_EMPLOYEE}`,
        {
          group_id: [Number(groupId)]
        },
        {
          headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
        }
      );
    } catch (error) {
      console.log(error);
    }

    const groupData = response?.data?.data?.[groupId];
    const userIds = groupData?.user_id || [];
    const employeeIds = groupData?.employee_id || [];

    if (userIds.length > 0) {
      const userDetails = await this.processResponse(userIds, USER_DETAILS);
      users.push(...userDetails);
    }

    if (employeeIds.length > 0) {
      const employeeDetails = await this.processResponse(employeeIds, EMPLOYEE_DETAILS);
      users.push(...employeeDetails);
    }

    return users;
  }
}
