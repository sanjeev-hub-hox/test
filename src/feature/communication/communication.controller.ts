import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  HttpStatus,
  UsePipes
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto, FilterDto, CreateAnnouncementDto } from './communication.dto';
import {
  IN_TO_OUT_TYPE,
  ISR_TICKET_GENERATION_URL,
  OUT_TO_IN_TYPE,
  PSR_TICKET_GENERATION_URL,
  ResponseService,
  TICKET_TOKEN,
  LoggerService,
  COMMUNICATION_CATEGORY,
  COMMUNICATION_SUB_CATEGORY,
  EMPLOYEE_DETAILS,
  USER_DETAILS,
  WORKFLOW,
  WORKFLOW_INIT,
  COMMUNICATION_PRIORITY,
  STUDENT_DETAILS
} from 'utils';
import { Response } from 'express';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunicationMasterService } from 'feature/communication-master/service';
import { NotificationService } from '../notification/service/notification.service';
import { CommunicationMasterModeService } from '../communication-master-modes/communication_master_mode.service';
import { NotificationToUserService } from '../notification/service/notificationToUser.service';
import axios from 'axios';
import * as qs from 'qs';

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private responseService: ResponseService,
    private readonly communicationMasterModeService: CommunicationMasterModeService,
    private readonly communicationMasterService: CommunicationMasterService,
    private notificationService: NotificationService,
    private notificationToUserService: NotificationToUserService
  ) {}

  private currentIndex: number = 0;

  @Get()
  @ApiResponse({ status: 200, description: 'Communication fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async fetchCommunication(@Query() query: { [key: string]: string }, @Res() res: Response) {
    let result: any = {};
    if (query?.communication_master_id) {
      result = await this.communicationService.findAllByCommunicationMasterId(
        query?.communication_master_id
      );
    }
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication fetched successfully'
    );
  }
  // Create a new communication
  @Post()
  @ApiBody({
    description: 'Create a new communication',
    type: CreateCommunicationDto,
    examples: {
      example1: {
        summary: 'Example of a new communication',
        value: {
          parent_id: '12345',
          communication_master_id: '67890',
          communication: 'Sample communication content',
          assign_to: 'user123',
          reviewer_id: 'reviewer456',
          date: '2024-09-30',
          time: '10:00:00',
          priority_id: 'high',
          tat: '24 hours',
          status: true,
          is_published: false,
          created_by: 'admin',
          ticket_number: 'TICKET-001',
          ticket_title: 'Test Ticket',
          attachment: 'path/to/attachment',
          lobs: 'LOB1, LOB2',
          mode_ids: ['mode1', 'mode2'],
          is_response_required: true,
          form_slug: 'form-123', // Optional
          student_id: 0
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Communication created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async create(
    @Body() createCommunicationDto: CreateCommunicationDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const token = req.headers['authorization'];
    let urlQuery: object = {};
    if (req.url.split('?')[1] !== undefined) {
      let query: string | string[] = req.url.split('?')[1];
      query = query.split('&');
      for (const param of query) {
        const [key, value] = param.split('=');
        if (key === 'platform' && value === 'app') {
          urlQuery[key] = value;
          break;
        }
      }
    }

    let communicationMasterId = createCommunicationDto.communication_master_id;
    const params = createCommunicationDto.params ?? {};
    let assignId = 1;
    let reviewerId = 0;
    let validMaster: boolean = false;
    let communicationMaster: any =
      await this.communicationMasterService.findByCategoryAndSubCategory({
        category_id: createCommunicationDto['category_id'],
        sub_category_id: createCommunicationDto['subcategory_id']
      });
    let communication_id = '';
    if (communicationMaster.length > 0) {
      validMaster = true;
      communicationMaster = communicationMaster[0];
      if (communicationMaster.type == OUT_TO_IN_TYPE) {
        const response = await axios.post(
          PSR_TICKET_GENERATION_URL,
          {
            school_id: 1
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + TICKET_TOKEN
            }
          }
        );
        createCommunicationDto.ticket_number = response.data.data.number;
      } else {
        const response = await axios.post(
          ISR_TICKET_GENERATION_URL,
          {
            school_id: 1
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + TICKET_TOKEN
            }
          }
        );
        createCommunicationDto.ticket_number = response.data.data.number;
      }

      // let getLastAssign: any =
      //   await this.communicationService.findByCommunicationMasterId(communicationMasterId);
      // if (getLastAssign) {
      //   assignId = getLastAssign.assign_to;
      // }
      assignId = await this.communicationService.getAssignId(
        communicationMaster.group_id,
        communicationMaster._id,
        communicationMaster.hris,
        communicationMaster.lobs
      );
      reviewerId = await this.communicationService.getAssignId(
        communicationMaster.group_id,
        communicationMaster._id,
        communicationMaster.reviewer_hris,
        communicationMaster.lobs
      );

      if (communicationMaster.dynamic_form_id) {
        createCommunicationDto['formId'] = communicationMaster.dynamic_form_id;
      }

      if (communicationMaster.form_slug) {
        createCommunicationDto['formSlug'] = communicationMaster.form_slug;
      }

      createCommunicationDto.mode_ids =
        communicationMaster?.communication_modes && communicationMaster?.communication_modes[0]
          ? communicationMaster?.communication_modes[0].mode_id
          : [];

      delete createCommunicationDto.params;

      createCommunicationDto.lobs = communicationMaster.lobs ?? '0';
      createCommunicationDto.is_published = true;
      createCommunicationDto.status = 'open';
      createCommunicationDto.tat = communicationMaster.tat_value;
      createCommunicationDto.date = new Date();
      createCommunicationDto.time = new Date().toTimeString().slice(0, 8);
      createCommunicationDto.reviewer_id = String(reviewerId);
      createCommunicationDto.communication_master_id = communicationMaster._id;
      createCommunicationDto.assign_to = String(assignId);
      createCommunicationDto.priority_id = communicationMaster.priority_id;
      createCommunicationDto.created_by = createCommunicationDto.created_by['user_id'];
      createCommunicationDto.is_response_required = false;
    }
    // let array: any[] = [1, 2, 3, 4];
    // const nextValue = this.getNext(array, assignId);
    const result = await this.communicationService.create(createCommunicationDto);
    communication_id = result['_id'];

    if (validMaster && communicationMaster.workflow_id != null) {
      let workflow: { [key: string]: string | string[] | object } = {
        module_name: 'communication',
        module_id: String(result['_id']),
        reference_id: String(communicationMaster._id),
        attachment_links: [''],
        lob_id: communicationMaster.lobs ?? '0',
        subject_variables: {},
        description_variables: {}
      };
      let response = await axios.get(WORKFLOW + `/${communicationMaster.workflow_id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + TICKET_TOKEN
        }
      });

      if (response.data.data != null) {
        response = response.data.data;
        workflow.activity_slug = response['attributes']['slug'];
        const queryString = qs.stringify(urlQuery, { encodeValuesOnly: true });
        await axios.post(
          `${WORKFLOW_INIT}/${createCommunicationDto.created_by}?${queryString}`,
          workflow,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token
            }
          }
        );
      }
    }

    // if (
    //   validMaster &&
    //   communicationMaster.type == IN_TO_OUT_TYPE &&
    //   communicationMaster.group_id.length > 0
    // ) {
    //   let employeeIds = await this.communicationMasterService.getEmployees(
    //     communicationMaster.group_id
    //   );
    //   let modes = await this.communicationMasterModeService.getCommunicationMasterModes(
    //     communicationMaster._id
    //   );
    //   let data = [];
    //   if (Object.keys(employeeIds).length > 0 && modes.length > 0) {
    //     let mode = {};
    //     for (const element of modes) {
    //       let subject = element.subject;
    //       let content = element.content;
    //       for (const key in params) {
    //         subject = subject.replace(`{{${key}}}`, params[key]);
    //         content = content.replace(`{{${key}}}`, params[key]);
    //       }
    //       mode[element.mode_id] = {
    //         subject: subject,
    //         content: content
    //       };
    //     }
    //     for (const groupId in employeeIds) {
    //       for (const key in employeeIds[groupId]) {
    //         for (const element of employeeIds[groupId][key]) {
    //           data.push({
    //             user_id: element,
    //             user_type: key == 'employee_id' ? 1 : 2,
    //             group_id: groupId,
    //             mode: mode
    //           });
    //         }
    //       }
    //     }
    //   }

    //   if (data.length > 0) {
    //     await this.notificationToUserService.createMany(data);
    //   }
    // }

    if (validMaster) {
      let userId = null;
      let empId: number[] = [];
      if ((communicationMaster.type = OUT_TO_IN_TYPE)) {
        userId = createCommunicationDto.created_by;
      } else {
        empId.push(Number(createCommunicationDto.created_by));
      }
      empId.push(Number(createCommunicationDto.assign_to));
      empId.push(Number(createCommunicationDto.reviewer_id));

      let email: string[] = [];
      let number: string[] = [];
      if (empId.length > 0) {
        const queryString = qs.stringify(
          { filters: { id: { $in: empId } } },
          { encodeValuesOnly: true }
        );
        let mdmData = await axios.get(`${EMPLOYEE_DETAILS}?${queryString}`, {
          headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
        });

        mdmData = mdmData['data'];
        if (mdmData['data'] != null || mdmData['data'].length != 0) {
          for (const element of mdmData['data']) {
            email.push(element.attributes.Official_Email_ID);
            number.push(element.attributes.Mobile);
          }
        }
      }
      if (userId != null) {
        const queryString = qs.stringify({ filters: { id: userId } }, { encodeValuesOnly: true });
        let mdmData = await axios.get(`${USER_DETAILS}?${queryString}`, {
          headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
        });
        mdmData = mdmData['data'];

        if (mdmData['data'] != null || mdmData['data'].length != 0) {
          mdmData = mdmData['data'][0];
          if (mdmData['attributes']['email'] != null) {
            email.push(mdmData['attributes']['email']);
          }
          if (mdmData['attributes']['mobile_no'] != null) {
            number.push(mdmData['attributes']['mobile_no']);
          }
        }
      }

      communicationMaster = await this.communicationMasterService.getAll({
        slug: communicationMaster.slug
      });
      communicationMaster = communicationMaster.data[0];

      await this.notificationService.sendNotification({
        communicationMaster: communicationMaster,
        mail_to: email,
        sms_to: number,
        communication_id: communication_id
      });
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.CREATED,
      result,
      'Communication created'
    );
  }

  // Create a new communication
  @Post('announcement')
  @ApiBody({
    description: 'Create a new communication',
    type: CreateAnnouncementDto,
    examples: {
      example1: {
        summary: 'Example of a new communication',
        value: {
          parent_id: '12345',
          communication_master_id: '67890',
          communication: 'Sample communication content',
          assign_to: 'user123',
          reviewer_id: 'reviewer456',
          date: '2024-09-30',
          time: '10:00:00',
          priority_id: 'high',
          tat: '24 hours',
          status: true,
          is_published: false,
          created_by: 'admin',
          ticket_number: 'TICKET-001',
          ticket_title: 'Test Ticket',
          attachment: 'path/to/attachment',
          otherSubCategory: 'other',
          user_id: '1451'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Communication created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async createAnnouncement(
    @Body() createCommunicationDto: CreateAnnouncementDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const token = req.headers['authorization'];
    let urlQuery: object = {};
    if (req.url.split('?')[1] !== undefined) {
      let query: string | string[] = req.url.split('?')[1];
      query = query.split('&');
      for (const param of query) {
        const [key, value] = param.split('=');
        if (key === 'platform' && value === 'app') {
          urlQuery[key] = value;
          break;
        }
      }
    }

    const params = createCommunicationDto.params ?? {};
    const published_date = createCommunicationDto.published_date ?? null;
    const end_date = createCommunicationDto.end_date ?? null;
    let validMaster: boolean = false;
    const masterFilter = {
      category_id: createCommunicationDto['category_id'],
      sub_category_id: createCommunicationDto['subcategory_id'],
      mode_id: createCommunicationDto['mode']
    };

    if (createCommunicationDto.destination) {
      masterFilter['destination'] = createCommunicationDto.destination;
    }

    let communicationMaster: any =
      await this.communicationMasterService.findByCategoryAndSubCategory(masterFilter);
    let communication_id = '';
    if (communicationMaster.length > 0) {
      validMaster = true;
      communicationMaster = communicationMaster[0];

      if (communicationMaster.dynamic_form_id) {
        createCommunicationDto['formId'] = communicationMaster.dynamic_form_id;
      }

      if (communicationMaster.form_slug) {
        createCommunicationDto['formSlug'] = communicationMaster.form_slug;
      }

      createCommunicationDto.mode_ids =
        communicationMaster?.communication_modes && communicationMaster?.communication_modes[0]
          ? communicationMaster?.communication_modes[0]
          : [];

      delete createCommunicationDto.params;

      createCommunicationDto.date = new Date();
      createCommunicationDto.time = new Date().toTimeString().slice(0, 8);
      createCommunicationDto.communication_master_id = communicationMaster._id;
      createCommunicationDto.priority_id = communicationMaster.priority_id;
      // createCommunicationDto.created_by = createCommunicationDto.created_by['user_id'];
      createCommunicationDto.created_by = '1';
      createCommunicationDto.is_response_required = false;
    } else {
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        {},
        'Communication Master does not exist'
      );
    }

    // OLD LOGIC : To add school ids based on user id
    // if (createCommunicationDto?.userId) {
    //   const schoolIds: any = await this.communicationService.getSchoolIds(
    //     createCommunicationDto?.userId
    //   );

    //   if (schoolIds && schoolIds?.length > 0) {
    //     createCommunicationDto['school_ids'] = schoolIds;
    //     delete createCommunicationDto?.userId;
    //   }
    // }

    const result = await this.communicationService.create(createCommunicationDto);
    communication_id = result['_id'];

    if (validMaster && communicationMaster.workflow_id != null) {
      let workflow: { [key: string]: string | string[] | object } = {
        module_name: 'communication',
        module_id: String(result['_id']),
        reference_id: String(communicationMaster._id),
        attachment_links: [''],
        lob_id: communicationMaster.lobs ?? '0',
        subject_variables: {},
        description_variables: {}
      };
      let response = await axios.get(WORKFLOW + `/${communicationMaster.workflow_id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + TICKET_TOKEN
        }
      });

      if (response.data.data != null) {
        response = response.data.data;
        workflow.activity_slug = response['attributes']['slug'];
        const queryString = qs.stringify(urlQuery, { encodeValuesOnly: true });
        await axios.post(
          `${WORKFLOW_INIT}/${createCommunicationDto.created_by}?${queryString}`,
          workflow,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token
            }
          }
        );
      }
    }

    if (validMaster) {
      const values: { [key: string]: any } = {
        communication_id: communication_id,
        published_date: published_date,
        end_date: end_date,
        subject: result.ticket_title,
        content: result.communication,
        mode: createCommunicationDto.mode
      };

      const individualType = createCommunicationDto.individualType;
      const userId = createCommunicationDto?.individualParents;
      if (communication_id !== undefined && communication_id !== '') {
        values['communication_id'] = communication_id;
      }
      if (createCommunicationDto?.to === 'group') {
        for (let id of createCommunicationDto.group_id) {
          await this.notificationService.createNotificationToUser(
            communicationMaster._id,
            params,
            values,
            id
          );
        }
      } else {
        await this.notificationService.createIndividualNotification(
          communicationMaster._id,
          params,
          values,
          createCommunicationDto?.cc_group_id,
          createCommunicationDto?.mode[0],
          individualType,
          userId
        );
      }
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.CREATED,
      result,
      'Communication created'
    );
  }

  // Get all communications
  @Post('list')
  @ApiResponse({ status: 200, description: 'Communications fetched successfully.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findAll(
    @Body() body: FilterDto,
    @Query() query: { [key: string]: string },
    @Res() res: Response
  ) {
    let result = JSON.parse(JSON.stringify(await this.communicationService.findAll({ ...body })));
    result = JSON.parse(JSON.stringify(result));
    if (result.data.length > 0) {
      let categoryId: number[] = [];
      let subCategoryId: number[] = [];
      let empId: number[] = [];
      let userId: number[] = [];
      for (const i of result.data) {
        if (i['assign_to'] != null && !empId.includes(i['assign_to'])) {
          empId.push(Number(i['assign_to']));
        }
        if (i['reviewer_id'] != null && !empId.includes(i['reviewer_id'])) {
          empId.push(Number(i['reviewer_id']));
        }
        if (i['communication_master'].length > 0) {
          if (i['communication_master'][0]['type'] == 2) {
            userId.push(Number(i.created_by));
          } else if (!empId.includes(i.created_by)) {
            empId.push(Number(i.created_by));
          }
        }
        if (
          i['communication_master'].length > 0 &&
          i['communication_master'][0]['category_id'] != null &&
          !categoryId.includes(i['communication_master'][0]['category_id'])
        ) {
          categoryId.push(Number(i['communication_master'][0]['category_id']));
        }
        if (
          i['communication_master'].length > 0 &&
          i['communication_master'][0]['sub_category_id'] != null &&
          !subCategoryId.includes(i['communication_master'][0]['sub_category_id'])
        ) {
          subCategoryId.push(Number(i['communication_master'][0]['sub_category_id']));
        }
      }

      let category = [];
      let subCategory = [];
      let employee = [];
      let user = [];

      [category, subCategory, employee, user] = await Promise.all([
        this.communicationMasterService.getMdmDataByIds(categoryId, COMMUNICATION_CATEGORY),
        this.communicationMasterService.getMdmDataByIds(subCategoryId, COMMUNICATION_SUB_CATEGORY),
        this.communicationMasterService.getMdmDataByIds(empId, EMPLOYEE_DETAILS),
        this.communicationMasterService.getMdmDataByIds(userId, USER_DETAILS)
      ]);

      for (const i in result.data) {
        let val = result.data[i];
        val['assign_to_id'] = val['assign_to'];
        val['reviewer'] = '--';
        let temp = val['communication_logs'].filter(function (itm) {
          return (
            (itm['rating'] == undefined || itm['rating'] == null) &&
            (query.platform === undefined ||
              itm.user_id == val.created_by ||
              itm.user_id == val.reviewer_id)
          );
        });
        val['communication_logs_count'] = temp.length;
        delete val['communication_logs'];

        if (val['assign_to'] != null) {
          let temp = employee.find(function (itm) {
            return itm.id == val['assign_to'];
          });
          if (temp) {
            val['assign_to'] = temp['attributes']['Full_Name'];
          }
        }
        if (val['reviewer_id'] != null) {
          let temp = employee.find(function (itm) {
            return itm.id == val['reviewer_id'];
          });
          if (temp) {
            val['reviewer'] = temp['attributes']['Full_Name'];
          }
        }

        if (val['communication_master'].length > 0) {
          val['communication_master'][0]['category'] = '--';
          val['communication_master'][0]['sub_category'] = '--';
          val.created_by_id = val.created_by;
          if (val['communication_master'][0]['type'] == 2) {
            val['type'] = 'psr';
            let temp = user.find(function (itm) {
              return itm.id == val.created_by;
            });
            if (temp) {
              val.created_by =
                temp['attributes']['first_name'] + ' ' + temp['attributes']['last_name'];
            }
          } else {
            val['type'] = 'isr';
            let temp = employee.find(function (itm) {
              return itm.id == val.created_by;
            });
            if (temp) {
              val.created_by = temp['attributes']['Full_Name'];
            }
          }

          if (val['communication_master'][0]['category_id'] != null) {
            let temp = category.find(function (itm) {
              return itm.id == val['communication_master'][0]['category_id'];
            });
            if (temp) {
              val['communication_master'][0]['category'] = temp['attributes']['name'];
            }
          }

          if (val['communication_master'][0]['sub_category_id'] != null) {
            let temp = subCategory.find(function (itm) {
              return itm.id == val['communication_master'][0]['sub_category_id'];
            });
            if (temp) {
              val['communication_master'][0]['sub_category'] = temp['attributes']['name'];
            }
          }
        }

        result.data[i] = val;
      }
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication fetched successfully'
    );
  }

  // Get a specific communication by id
  @Get(':id')
  @ApiResponse({ status: 200, description: 'Communication fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findById(@Param('id') id: string, @Res() res: Response) {
    let result = await this.communicationService.findById(id);

    let empId = [];
    let userId = [];
    if (result.assign_to != null) {
      empId.push(result.assign_to);
    }
    if (result.reviewer_id != null && !empId.includes(result.reviewer_id)) {
      empId.push(result.reviewer_id);
    }

    if (result['communication_logs'].length > 0) {
      for (const i of result['communication_logs']) {
        if (i.user_type == 'external' && !empId.includes(i.user_id)) {
          empId.push(i.user_id);
        } else if (!userId.includes(i.user_id)) {
          userId.push(i.user_id);
        }
      }
    }

    let employee = [];
    let user = [];
    if (empId.length > 0) {
      const queryString = qs.stringify(
        { filters: { id: { $in: empId } } },
        { encodeValuesOnly: true }
      );
      let mdmData = await axios.get(`${EMPLOYEE_DETAILS}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        employee = mdmData['data'];
      }
    }
    if (userId.length > 0) {
      const queryString = qs.stringify(
        { filters: { id: { $in: userId } } },
        { encodeValuesOnly: true }
      );
      let mdmData = await axios.get(`${USER_DETAILS}?${queryString}`, {
        headers: { Authorization: `Bearer ${TICKET_TOKEN}` }
      });
      mdmData = mdmData['data'];
      if (mdmData['data'] != null || mdmData['data'].length != 0) {
        user = mdmData['data'];
      }
    }

    if (result.assign_to != null) {
      let temp = employee.find(function (itm) {
        return itm.id == result.assign_to;
      });
      if (temp) {
        result.assign_to = temp['attributes']['Full_Name'];
      }
    }
    if (result.reviewer_id != null) {
      let temp = employee.find(function (itm) {
        return itm.id == result.reviewer_id;
      });
      if (temp) {
        result.reviewer_id = temp['attributes']['Full_Name'];
      }
    }

    if (result['communication_logs'].length > 0) {
      for (const i in result['communication_logs']) {
        let val = result['communication_logs'][i];
        if (val.user_type == 'external') {
          let temp = employee.find(function (itm) {
            return itm.id == val.user_id;
          });
          if (temp) {
            val.user_id = temp['attributes']['Full_Name'];
          }
        } else {
          let temp = user.find(function (itm) {
            return itm.id == val.user_id;
          });
          if (temp) {
            val.user_id = temp['attributes']['first_name'] + ' ' + temp['attributes']['last_name'];
          }
        }
        result['communication_logs'][i] = val;
      }
    }
    if (result.attachment.length !== 0) {
      let attachmentList = [];
      for (let file of result.attachment) {
        let attachment = await this.notificationService.getUploadedDocumentUrl(file);
        attachmentList.push(attachment);
      }
      result.attachment = attachmentList;
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication fetched successfully'
    );
  }

  // Update a communication by id
  @Put(':id')
  @ApiBody({
    description: 'Update an existing communication',
    type: CreateCommunicationDto,
    examples: {
      example1: {
        summary: 'Example of updating communication',
        value: {
          communication_master_id: '67890',
          communication: 'Updated communication content',
          assign_to: 'user123',
          reviewer_id: 'reviewer456',
          date: '2024-09-30',
          time: '10:00:00',
          priority_id: 'medium',
          tat: '48 hours',
          status: false,
          is_published: true,
          updated_at: new Date().toISOString(),
          ticket_number: 'TICKET-002',
          ticket_title: 'Updated Test Ticket',
          attachment: 'path/to/new_attachment',
          lobs: 'LOB1, LOB3',
          mode_ids: ['mode1'],
          is_response_required: false,
          form_slug: 'form-456' // Optional
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Communication updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async update(
    @Param('id') id: string,
    @Body() updateCommunicationDto: Partial<CreateCommunicationDto>,
    @Res() res: Response
  ) {
    await this.communicationService.update(id, updateCommunicationDto);
    let result = await this.communicationService.findById(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication updated successfully'
    );
  }

  @Put('announcement/:id')
  @ApiResponse({ status: 200, description: 'Communication updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() updateCommunicationDto: Partial<CreateAnnouncementDto>,
    @Res() res: Response
  ) {
    // if (updateCommunicationDto?.userId) {
    //   const schoolIds: any = await this.communicationService.getSchoolIds(
    //     updateCommunicationDto?.userId
    //   );

    //   if (schoolIds && schoolIds?.length > 0) {
    //     updateCommunicationDto['school_ids'] = schoolIds;
    //     delete updateCommunicationDto?.userId;
    //   }
    // }
    await this.communicationService.update(id, updateCommunicationDto);
    let result: any = await this.communicationService.findById(id);

    await this.notificationToUserService.deleteByCommunicationId(id);

    const params = updateCommunicationDto.params ?? {};
    const published_date = updateCommunicationDto.published_date ?? null;
    const end_date = updateCommunicationDto.end_date ?? null;
    let validMaster: boolean = false;
    const masterFilter = {
      category_id: updateCommunicationDto['category_id'],
      sub_category_id: updateCommunicationDto['subcategory_id'],
      mode_id: updateCommunicationDto['mode']
    };

    if (updateCommunicationDto.destination) {
      masterFilter['destination'] = updateCommunicationDto.destination;
    }
    let communicationMaster: any =
      await this.communicationMasterService.findByCategoryAndSubCategory(masterFilter);
    let communication_id = '';
    if (communicationMaster.length > 0) {
      validMaster = true;
      communicationMaster = communicationMaster[0];

      if (communicationMaster.dynamic_form_id) {
        updateCommunicationDto['formId'] = communicationMaster.dynamic_form_id;
      }

      if (communicationMaster.form_slug) {
        updateCommunicationDto['formSlug'] = communicationMaster.form_slug;
      }

      updateCommunicationDto.mode_ids =
        communicationMaster?.communication_modes && communicationMaster?.communication_modes[0]
          ? communicationMaster?.communication_modes[0]
          : [];

      delete updateCommunicationDto.params;

      updateCommunicationDto.date = new Date();
      updateCommunicationDto.time = new Date().toTimeString().slice(0, 8);
      updateCommunicationDto.communication_master_id = communicationMaster._id;
      updateCommunicationDto.priority_id = communicationMaster.priority_id;
      updateCommunicationDto.created_by = '1';
      updateCommunicationDto.is_response_required = false;
    } else {
      return this.responseService.sendResponse(
        res,
        HttpStatus.BAD_REQUEST,
        {},
        'Communication Master does not exist'
      );
    }

    if (validMaster) {
      const values: { [key: string]: any } = {
        communication_id: result?._id,
        published_date: published_date,
        end_date: end_date,
        subject: result.ticket_title,
        content: result.communication,
        mode: updateCommunicationDto.mode
      };

      const individualType = updateCommunicationDto.individualType;
      const userId = updateCommunicationDto?.individualParents;
      if (communication_id !== undefined && communication_id !== '') {
        values['communication_id'] = communication_id;
      }
      if (updateCommunicationDto?.to === 'group') {
        for (let id of updateCommunicationDto.group_id) {
          await this.notificationService.createNotificationToUser(
            communicationMaster._id,
            params,
            values,
            id
          );
        }
      } else {
        await this.notificationService.createIndividualNotification(
          communicationMaster._id,
          params,
          values,
          updateCommunicationDto?.cc_group_id,
          updateCommunicationDto?.mode,
          individualType,
          userId
        );
      }
    }

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      result,
      'Communication updated successfully'
    );
  }

  // Delete a communication by id
  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Communication deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async delete(@Param('id') id: string, @Res() res: Response) {
    await this.communicationService.delete(id);
    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      null,
      'Communication deleted successfully'
    );
  }

  getNext(assignValues, assignId): number {
    let value = assignValues[this.currentIndex];
    if (assignId > 0 && !assignValues.includes(assignId)) {
      value = assignId;
    }
    this.currentIndex = (this.currentIndex + 1) % assignValues.length;
    return value;
  }

  // Get Details
  @Get('/detalis/:id')
  @ApiResponse({ status: 200, description: 'Communication details fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async psrDetails(
    @Param('id') id: string,
    @Query() query: { [key: string]: string },
    @Res() res: Response
  ) {
    let result = await this.communicationService.getDetails(id);
    result = JSON.parse(JSON.stringify(result));

    if (result == null) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.NOT_FOUND,
        [],
        'Communication not found'
      );
    }
    let empId: number[] = [];
    let userId: number[] = [];
    let categoryId: number[] = [];
    let subCategoryId: number[] = [];
    let priorityId: number[] = [];
    let studentId: number[] = [];
    if (result.assign_to != null) {
      empId.push(Number(result.assign_to));
    }
    if (result.reviewer_id != null && !empId.includes(Number(result.reviewer_id))) {
      empId.push(Number(result.reviewer_id));
    }

    if (result['communication_master'].length > 0) {
      if (result['communication_master'][0]['type'] == OUT_TO_IN_TYPE) {
        userId.push(Number(result.created_by));
      } else if (!empId.includes(Number(result.created_by))) {
        empId.push(Number(result.created_by));
      }

      if (result['communication_master'][0]['category_id'] != null) {
        categoryId.push(result['communication_master'][0]['category_id']);
      }
      if (result['communication_master'][0]['sub_category_id'] != null) {
        subCategoryId.push(result['communication_master'][0]['sub_category_id']);
      }
    }

    if (result.priority_id != null) {
      priorityId.push(Number(result.priority_id));
    }

    if (result.student_id != undefined && result.student_id != null) {
      studentId.push(Number(result.student_id));
    }

    if (result['communication_logs'].length > 0) {
      for (const element of result['communication_logs']) {
        if (
          result.created_by == element.user_id &&
          result['communication_master'][0]['type'] == OUT_TO_IN_TYPE &&
          !userId.includes(element.user_id)
        ) {
          userId.push(element.user_id);
        } else if (
          result['communication_master'][0]['type'] != OUT_TO_IN_TYPE &&
          !empId.includes(element.user_id)
        ) {
          empId.push(element.user_id);
        }
      }
    }

    let employee = [];
    let user = [];
    let category = [];
    let subCategory = [];
    let priority = [];
    let student = [];

    [category, subCategory, priority, employee, user, student] = await Promise.all([
      this.communicationMasterService.getMdmDataByIds(categoryId, COMMUNICATION_CATEGORY),
      this.communicationMasterService.getMdmDataByIds(subCategoryId, COMMUNICATION_SUB_CATEGORY),
      this.communicationMasterService.getMdmDataByIds(priorityId, COMMUNICATION_PRIORITY),
      this.communicationMasterService.getMdmDataByIds(empId, EMPLOYEE_DETAILS),
      this.communicationMasterService.getMdmDataByIds(userId, USER_DETAILS),
      this.communicationMasterService.getMdmDataByIds(studentId, STUDENT_DETAILS)
    ]);

    result['assign_to_id'] = result.assign_to;
    result['reviewer'] = '--';
    result['created_by_id'] = result.created_by;
    if (result.assign_to != null) {
      let temp = employee.find(function (itm) {
        return itm.id == result.assign_to;
      });
      if (temp) {
        result.assign_to = temp['attributes']['Full_Name'];
      } else {
        result.assign_to = '--';
      }
    }
    if (result.reviewer_id != null) {
      let temp = employee.find(function (itm) {
        return itm.id == result.reviewer_id;
      });
      if (temp) {
        result['reviewer'] = temp['attributes']['Full_Name'];
      }
    }

    if (result['communication_master'].length > 0) {
      result['communication_master'][0] = {
        ...result['communication_master'][0],
        ...{
          category: '--',
          sub_category: '--'
        }
      };
      if (result['communication_master'][0]['type'] == 2) {
        result['to_type'] = 'psr';
        let temp = user.find(function (itm) {
          return itm.id == result.created_by;
        });
        if (temp) {
          result.created_by =
            temp['attributes']['first_name'] + ' ' + temp['attributes']['last_name'];
        }
      } else {
        result['to_type'] = 'isr';
        let temp = employee.find(function (itm) {
          return itm.id == result.created_by;
        });
        if (temp) {
          result.created_by = temp['attributes']['Full_Name'];
        }
      }

      if (result['communication_master'][0]['category_id'] != null) {
        let temp = category.find(function (itm) {
          return itm['id'] == result['communication_master'][0]['category_id'];
        });
        if (temp) {
          result['communication_master'][0]['category'] = temp['attributes']['name'];
        }
      }
      if (result['communication_master'][0]['sub_category_id'] != null) {
        let temp = subCategory.find(function (itm) {
          return itm['id'] == result['communication_master'][0]['sub_category_id'];
        });
        if (temp) {
          result['communication_master'][0]['sub_category'] = temp['attributes']['name'];
        }
      }
    }

    result = {
      ...result,
      ...{
        priority: '--',
        student: '--'
      }
    };
    if (result['priority_id'] != null) {
      let temp = priority.find(function (itm) {
        return itm['id'] == result['priority_id'];
      });
      if (temp) {
        result['priority'] = temp['attributes']['priority'];
      }
    }
    if (result['student_id'] != undefined && result['student_id'] != null) {
      let temp = student.find(function (itm) {
        return itm['id'] == result['student_id'];
      });
      if (temp) {
        result['student'] =
          temp['attributes']['first_name'] + ' ' + temp['attributes']['last_name'];
      }
    }

    // need to implement by user type wise
    if (result['communication_logs'].length > 0) {
      let communication_logs = [];
      for (const key in result['communication_logs']) {
        const element = result['communication_logs'][key];

        if (
          query.platform === undefined ||
          element.user_id == result['created_by_id'] ||
          element.user_id == result.reviewer_id
        ) {
          if (result['communication_master'][0]['type'] == OUT_TO_IN_TYPE) {
            let temp = user.find(function (itm) {
              return itm.id == element.user_id;
            });
            if (temp) {
              element.user =
                temp['attributes']['first_name'] + ' ' + temp['attributes']['last_name'];
            }
          } else {
            let temp = employee.find(function (itm) {
              return itm.id == element.user_id;
            });
            if (temp) {
              element.user = temp['attributes']['Full_Name'];
            }
          }

          if (element.attachment_details != null && element.attachment_details != '') {
            element['attachment_name'] = element.attachment_details;
            let attachment = await this.notificationService.getUploadedDocumentUrl(
              element.attachment_details
            );
            element.attachment_details = attachment;
          } else {
            element.attachment_details = null;
            element['attachment_name'] = null;
          }

          communication_logs.push(element);
        }
      }
      result['communication_logs'] = communication_logs;
    }

    if (result?.attachment?.length !== 0) {
      let attachmentList = [];
      for (let file of result.attachment) {
        let attachment = await this.notificationService.getUploadedDocumentUrl(file);
        attachmentList.push(attachment);
      }
      result.attachment = attachmentList;
    }

    return this.responseService.sendResponse(res, HttpStatus.OK, result, 'Communication not found');
  }

  @Put('announcement/soft-delete/:master_id')
  @ApiResponse({ status: 200, description: 'Communication updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Communication not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async softDeleteAnnouncement(
    @Param('master_id') master_id: string,
    @Body('userEmail') userEmail: string,
    @Res() res: Response
  ) {
    await this.communicationService.updateByMasterId(master_id, {
      is_deleted: 1,
      deleted_by: userEmail
    });

    await this.notificationToUserService.softDeleteByMasterId(master_id, { is_deleted: 1 });

    return this.responseService.sendResponse(
      res,
      HttpStatus.OK,
      {},
      'Communication updated successfully'
    );
  }

  @Post('/parent-details')
  @ApiResponse({ status: 200, description: 'Parent details fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Parent details not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async parentDetails(@Body() payload: any, @Req() req: Request, @Res() res: Response) {
    try {
      const token = req.headers['authorization'];
      const response = await this.notificationService.getParentDetails(payload, token);

      if (!response) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.OK,
          [],
          'Parent details not found.'
        );
      }

      return this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        response,
        'Parent details fetched successfully'
      );
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error.'
      });
    }
  }
}
