import { Injectable } from '@nestjs/common';
import { CommunicationRepository } from './communication.repository';
import { CreateCommunicationDto, CreateAnnouncementDto } from './communication.dto';
import axios from 'axios';
import * as qs from 'qs';
import {
  TICKET_TOKEN,
  COMMUNICATION_GROUP,
  HRIS_MASTER,
  EMPLOYEE_DETAILS,
  MDM_API_URLS,
  SCHOOL,
  SEGMENT_LOB,
  HR_EMPLOYEE_MASTER
} from 'utils';
import { Communication } from './communication.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';

@Injectable()
export class CommunicationService {
  constructor(
    private communicationRepository: CommunicationRepository,
    @InjectModel(Communication.name)
    private communicationsModel: Model<Communication>
  ) {}

  async create(createCommunicationDto: CreateCommunicationDto | CreateAnnouncementDto) {
    return this.communicationRepository.create(createCommunicationDto);
  }

  async findAll(body: any) {
    const page = body.page || 1;
    const limit = body.pageSize || 10;

    let schoolIds;
    if (body?.school_ids && Array.isArray(body?.school_ids) && body?.school_ids.length > 0) {
      schoolIds = body?.school_ids;
    }
    // } else if (body?.userId !== undefined || body?.userId !== null) {
    //   schoolIds = await this.getSchoolIds(body?.userId);
    // }
    const result = await this.communicationRepository.findAll(body, schoolIds);
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

  async findById(id: string) {
    return this.communicationRepository.findById(id);
  }

  async findByCommunicationMasterId(communication_master_id: string) {
    return this.communicationRepository.findByCommunicationMasterId(communication_master_id);
  }

  async findAllByCommunicationMasterId(communication_master_id: string) {
    return this.communicationRepository.findAllByCommunicationMasterId(communication_master_id);
  }

  async updateByMasterId(
    master_id: string,
    updateCommunicationDto: Partial<CreateCommunicationDto>
  ) {
    return this.communicationRepository.updateMany(
      { communication_master_id: master_id },
      updateCommunicationDto
    );
  }

  async update(id: string, updateCommunicationDto: Partial<CreateCommunicationDto>) {
    return this.communicationRepository.update(id, updateCommunicationDto);
  }

  async delete(id: string) {
    return this.communicationRepository.delete(id);
  }

  async getDetails(id: string) {
    return await this.communicationRepository.getDetails(id);
  }

  async getAssignId(group_id: number[], communicationMasterid: string, hris: number, lobs: string) {
    let assignId = null;
    let getLastAssign =
      await this.communicationRepository.findByCommunicationMasterId(communicationMasterid);
    if (getLastAssign) {
      assignId = getLastAssign['assign_to'];
    } else {
      assignId = 1;
    }

    let hr_hris_unique_role = 0;
    let queryString: string;
    let mdmData;
    if (hris) {
      queryString = qs.stringify(
        {
          filters: { id: hris },
          populate: { 0: 'hris_unique_role' }
        },
        { encodeValuesOnly: true }
      );

      console.log('${HRIS_MASTER}', `${HRIS_MASTER}`);
      console.log('${queryString}', `${queryString}`);

      mdmData = await axios.get(`${HRIS_MASTER}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (
        mdmData['data'] != null ||
        (mdmData['data'].length != 0 && mdmData['data'][0].attributes.hris_unique_role != null)
      ) {
        hr_hris_unique_role = mdmData['data'][0].attributes.hris_unique_role.data.id;
      }
    }

    let employeeIds = [];
    if (hr_hris_unique_role != 0) {
      queryString = qs.stringify(
        {
          filters: { hr_hris_unique_role: hr_hris_unique_role, Business_Verticals: lobs },
          pagination: { pageSize: 100 }
        },
        { encodeValuesOnly: true }
      );
      mdmData = await axios.get(`${EMPLOYEE_DETAILS}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        for (const element of mdmData['data']) {
          if (!employeeIds.includes(Number(element.id))) {
            employeeIds.push(Number(element.id));
          }
        }
      }
    }
    let index = -1;
    if (employeeIds.length > 0) {
      index = employeeIds.indexOf(Number(assignId));
      if (index >= employeeIds.length - 1) {
        index = index + 1;
        if (employeeIds[index] === undefined) {
          index = 0;
        }
      } else {
        index = 0;
      }
      assignId = employeeIds[index];
    }

    return assignId;
  }

  async getByQuery(query) {
    return await this.communicationRepository.getByQuery(query);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'checkCommunicationTat',
    timeZone: 'Asia/Kolkata'
  })
  async communicationTatWorkflow() {
    console.log('Running Communication TAT Workflow ------------>');

    try {
      const expiredCommunications = await this.communicationsModel.aggregate([
        {
          // Lookup to join with the communicationMaster collection
          $lookup: {
            from: 'communicationMaster',
            let: { communicationMasterId: '$communication_master_id' },
            pipeline: [
              {
                $addFields: {
                  _id_str: { $toString: '$_id' } // Convert _id to string
                }
              },
              {
                $match: {
                  $expr: { $eq: ['$_id_str', '$$communicationMasterId'] }
                }
              }
            ],
            as: 'master_data'
          }
        },
        {
          // Unwind the joined data
          $unwind: {
            path: '$master_data',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $addFields: {
            tat_value: '$master_data.tat_value',
            tat_type: '$master_data.tat_type',
            created_at: '$created_at'
          }
        },
        {
          // Exclude records that already have a workflowId in tat_workflow
          $match: {
            tat_value: { $ne: null },
            tat_type: { $in: [1, 2] },
            tat_workflow: { $eq: null }
          }
        },
        {
          // Calculate the tat_expiry based on tat_type
          $addFields: {
            tat_expiry: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$tat_type', 1] }, // tat_type = 1 (Days)
                    then: {
                      $dateAdd: { startDate: '$created_at', unit: 'day', amount: '$tat_value' }
                    }
                  },
                  {
                    case: { $eq: ['$tat_type', 2] }, // tat_type = 2 (Hours)
                    then: {
                      $dateAdd: { startDate: '$created_at', unit: 'hour', amount: '$tat_value' }
                    }
                  }
                ],
                default: '$created_at'
              }
            }
          }
        },
        {
          // Add current time
          $addFields: {
            current_time: new Date()
          }
        },
        {
          // Filter documents where TAT has expired
          $match: {
            $expr: {
              $lt: ['$tat_expiry', '$current_time']
            }
          }
        }
      ]);

      // console.log('Expired Communications:', expiredCommunications);

      for (const comm of expiredCommunications) {
        try {
          const apiResponse = await axios.post(
            process.env.ADMIN_BASE_URL + 'admin/workflow/logs/' + Number(comm?.assign_to),
            {
              activity_slug: 'communication_tat_expired',
              subject_variables: {
                title: comm.ticket_number
              },
              description_variables: {
                title: comm.ticket_number
              },
              module_name: 'communication_tat_expired',
              module_id: 'test-module-id',
              reference_id: 'test-reference-id',
              attachment_links: [],
              lob_id: 'test-lob-id'
            }
          );
          if (apiResponse.status === 200 && apiResponse?.data?.data?._id) {
            const workflowId = apiResponse?.data?.data?._id;

            // Update tat_workflow with the received workflowId
            await this.communicationsModel.updateOne(
              { _id: comm._id },
              { $set: { tat_workflow: workflowId } }
            );
            console.log(
              `Notification sent and workflowId updated for communication ID: ${comm._id}`
            );
          } else {
            console.error(
              `API call failed or missing workflowId for communication ID: ${comm._id}`,
              apiResponse
            );
          }
        } catch (apiError) {
          console.error(`Error calling API for communication ID: ${comm._id}`, apiError);
        }
      }
    } catch (error) {
      console.error('Error processing communication TAT notifications:', error);
    }
  }

  async getSchoolIds(userId: string | number) {
    let baseLocationId: number | null = null;

    console.log('Fetching base location ID for user:', userId);
    try {
      const queryString = qs.stringify(
        {
          filters: { id: userId },
          populate: { 0: 'Base_Location' }
        },
        { encodeValuesOnly: true }
      );
      console.log(`${HR_EMPLOYEE_MASTER}?${queryString}`);
      const hrEmployeeMasterData = await axios.get(`${HR_EMPLOYEE_MASTER}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      if (
        hrEmployeeMasterData['data'] != null ||
        (hrEmployeeMasterData['data'].length != 0 &&
          hrEmployeeMasterData['data']['data'][0]?.attributes?.Base_Location?.data?.id != null)
      ) {
        baseLocationId =
          hrEmployeeMasterData['data']['data'][0]?.attributes?.Base_Location?.data?.id;
      }
    } catch (error) {
      console.log('Error fetching base location ID:', error);
      return [
        {
          message: 'Error fetching base location ID'
        }
      ];
    }

    let parent1Id: number | null = null;

    console.log('Fetching parent1 ID for user:', baseLocationId);
    try {
      const queryString = qs.stringify(
        {
          filters: { id: baseLocationId }
        },
        { encodeValuesOnly: true }
      );
      const segmentLobData = await axios.get(`${SEGMENT_LOB}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      if (
        segmentLobData['data'] != null ||
        (segmentLobData['data'].length != 0 &&
          segmentLobData['data']['data'][0]?.attributes?.parent1_id != null)
      ) {
        parent1Id = segmentLobData['data']['data'][0]?.attributes?.parent1_id;
      }
    } catch (error) {
      console.log('Error fetching parent1 ID:', error);
      return [
        {
          message: 'Error fetching parent1 ID'
        }
      ];
    }

    let uniqueSchoolIds: any;

    console.log('Fetching School IDs for user:', parent1Id);
    try {
      const queryString = qs.stringify(
        {
          filters: { code: parent1Id }
        },
        { encodeValuesOnly: true }
      );
      const acSchoolData = await axios.get(`${SCHOOL}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      if (acSchoolData['data']['data'] != null || acSchoolData['data']['data'].length != 0) {
        const schoolIds = acSchoolData['data']['data'].map(
          (school: any) => school?.attributes?.school_parent_id
        );

        uniqueSchoolIds = [...new Set(schoolIds)].filter((id) => id !== null && id !== undefined);
      }

      console.log(`Fetched School IDs ${uniqueSchoolIds} for User ID :- ${userId}`);
      return uniqueSchoolIds;
    } catch (error) {
      console.log('Error fetching School IDs:', error);
      return [
        {
          message: 'Error fetching School IDs'
        }
      ];
    }
  }
}
