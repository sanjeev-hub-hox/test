import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TemplateRepository } from './template.repository';
import { ETemplateChannel, TTemplate, TTemplateChannel } from './template.type';
import { CreateTemplateRequest, EditTemplateRequest, ListTemplateRequest } from './template.dto';
import { Types } from 'mongoose';
import { LoggerService, getRandomId } from '../../utils';

@Injectable()
export class TemplateService {
  constructor(
    private templateRepository: TemplateRepository,
    private loggerService: LoggerService
  ) {}

  async getTemplateDetailsBySlug(slug: string): Promise<TTemplate> {
    const template = await this.templateRepository.getOne({ slug: slug });
    return template;
  }

  async createTemplate(body: CreateTemplateRequest): Promise<TTemplate> {
    const isSlugUnique = await this.checkSlugUniqueness(body.slug);
    if (!isSlugUnique) {
      this.loggerService.error(
        'Creating template failed because the provided template slug is not unique'
      );
      throw new HttpException('Template slug name already exists', HttpStatus.BAD_REQUEST);
    }
    const payload = { ...body };
    const channels = [];
    body.channels.map((channelData) => {
      const channelPayload = {
        ...channelData,
        channel_template_id: channelData.channel_template_id ?? 'TEMPCHANNEL' + getRandomId()
      };
      return channels.push(channelPayload);
    });
    payload.channels = channels;
    return this.templateRepository.create(payload);
  }

  async checkSlugUniqueness(slug: string): Promise<boolean> {
    const template = await this.templateRepository.getOne({ slug: new RegExp(slug, 'i') });
    if (template) {
      return false;
    }
    return true;
  }

  async cloneTemplate(templateId: string): Promise<TTemplate> {
    const isTemplate = await this.templateRepository.getById(new Types.ObjectId(templateId));
    if (!isTemplate) {
      this.loggerService.error('Cloning template failed because template to be cloned not found');
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }
    const copyCount = await this.templateRepository.aggregate([
      {
        $match: {
          slug: {
            $regex: new RegExp(`${isTemplate.slug} - copy`, 'i')
          }
        }
      },
      {
        $count: 'copyCount'
      }
    ]);

    const clonedTemplatePayload = {
      ...JSON.parse(JSON.stringify(isTemplate))
    };
    delete clonedTemplatePayload._id;
    delete clonedTemplatePayload.created_at;
    delete clonedTemplatePayload.updated_at;
    delete clonedTemplatePayload.template_id;
    clonedTemplatePayload.slug = copyCount.length
      ? `${isTemplate.slug} - copy(${copyCount[0].copyCount + 1})`
      : `${isTemplate.slug} - copy`;
    const clonedTemplate = await this.createTemplate(clonedTemplatePayload);

    if (!clonedTemplate) {
      this.loggerService.error(
        'Cloning template failed because something went wrong while inserting cloning template data into DB'
      );
      throw new HttpException('Failed while cloning template', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return clonedTemplate;
  }

  async editTemplate(templateId: string, payload: EditTemplateRequest) {
    const currentTemplate = await this.templateRepository.getById(new Types.ObjectId(templateId));

    if (!currentTemplate) {
      this.loggerService.error('Editing template failed because template not found');
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }

    const newTemplatePayload = {
      ...JSON.parse(JSON.stringify(currentTemplate))
    };

    if (payload?.slug && currentTemplate.slug !== payload?.slug) {
      const isSlugUnique = await this.checkSlugUniqueness(payload.slug);
      if (!isSlugUnique) {
        this.loggerService.error(
          'Editing template failed because the provided template slug is not unique'
        );
        throw new HttpException('Slug already exists', HttpStatus.BAD_REQUEST);
      }
      newTemplatePayload.slug = payload.slug;
    }

    const channelNames = newTemplatePayload.channels.map((channel) => channel.name);
    const { channels } = payload;
    for (const channel of channels) {
      const channelIndex = channelNames.indexOf(channel.name);
      const { template_data } = channel;

      if (channelIndex === -1) {
        throw new HttpException('Channel does not exist for this template', HttpStatus.BAD_REQUEST);
      }
      //Input channel template data has some additional fields
      if (
        Object.keys(template_data).length >
        Object.keys(newTemplatePayload.channels[channelIndex].template_data).length
      ) {
        const updatedChannelTemplateData = {
          ...newTemplatePayload.channels[channelIndex].template_data,
          ...template_data
        };
        newTemplatePayload.channels[channelIndex].template_data = updatedChannelTemplateData;
      } else {
        //Input channel template data has less fields
        const updatedChannelTemplateData = {
          ...template_data
        };
        newTemplatePayload.channels[channelIndex].template_data = updatedChannelTemplateData;
      }
    }
    const updateResult = await this.templateRepository.updateOne(
      { _id: new Types.ObjectId(templateId) },
      newTemplatePayload
    );
    return updateResult;
  }

  async editTemplateChannel(action: string, templateId: string, payload: any) {
    const currentTemplate = await this.templateRepository.getById(new Types.ObjectId(templateId));

    if (!currentTemplate) {
      this.loggerService.error('Editing template failed because template not found');
      throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
    }

    const newTemplatePayload = {
      ...JSON.parse(JSON.stringify(currentTemplate))
    };

    const channelNames = newTemplatePayload.channels.map((channel) => channel.name);
    if (action === 'add') {
      if (channelNames.includes(payload.name)) {
        this.loggerService.error(
          'Adding channel template failed because template channel already exists'
        );
        throw new HttpException(`${payload.name} template already exists`, HttpStatus.BAD_REQUEST);
      }

      const updatedChannels = [payload, ...newTemplatePayload.channels];
      newTemplatePayload.channels = updatedChannels;

      const updateResult = await this.templateRepository.updateOne(
        { _id: new Types.ObjectId(templateId) },
        newTemplatePayload
      );
      return updateResult;
    } else {
      if (!channelNames.includes(payload.name)) {
        this.loggerService.error(
          'Remove channel template failed because template channel does not exists'
        );
        throw new HttpException(`${payload.name} template doesn't exists`, HttpStatus.BAD_REQUEST);
      }

      const updatedChannels = newTemplatePayload.channels.filter(
        (channel) => channel.name !== payload.name
      );
      newTemplatePayload.channels = updatedChannels;

      const updateResult = await this.templateRepository.updateOne(
        { _id: new Types.ObjectId(templateId) },
        newTemplatePayload
      );
      return updateResult;
    }
  }

  async getTemplateList(queryString: ListTemplateRequest) {
    const pageNumber = Number(queryString.pageNumber);
    const pageSize = Number(queryString.pageSize);
    const aggregateQuery = [];
    const matchCondition = {};
    if (queryString.templateId) {
      matchCondition['template_id'] = { $eq: queryString.templateId };
    }
    if (queryString.type) {
      matchCondition['type'] = { $eq: queryString.type };
    }

    if (queryString.slug) {
      matchCondition['slug'] = { $eq: queryString.slug };
    }

    if (queryString.active) {
      matchCondition['is_active'] = { $eq: queryString.active === 'true' ? true : false };
    }

    if (queryString.active) {
      matchCondition['is_deleted'] = { $eq: queryString.delete === 'true' ? true : false };
    }

    aggregateQuery.push({
      $match: matchCondition
    });

    if (queryString.sort && queryString.sortBy) {
      aggregateQuery.push({
        $sort: {
          [queryString.sort]: queryString.sortBy === 'asc' ? 1 : -1
        }
      });
    }

    aggregateQuery.push(
      ...[
        {
          $project: {
            template_id: 1,
            type: 1,
            slug: 1,
            channels: '$channels.name',
            is_active: 1,
            is_deleted: 1,
            created_at: 1
          }
        },
        {
          $facet: {
            totalCount: [{ $count: 'value' }],
            paginatedResults: [
              {
                $skip: (pageNumber - 1) * pageSize
              },
              {
                $limit: pageSize
              }
            ]
          }
        },
        {
          $project: {
            totalCount: { $arrayElemAt: ['$totalCount.value', 0] },
            isNextPage: {
              $cond: {
                if: {
                  $gt: [{ $arrayElemAt: ['$totalCount.value', 0] }, pageSize * pageNumber]
                },
                then: true,
                else: false
              }
            },
            data: '$paginatedResults'
          }
        }
      ]
    );

    this.loggerService.log(`Aggregate query : ${JSON.stringify(aggregateQuery)}`);
    return this.templateRepository.aggregate(aggregateQuery);
  }

  async getTemplateChannelDetails(templateId: string, channel: string): Promise<TTemplateChannel> {
    const templateChannelDetails = await this.templateRepository.getOne({
      _id: new Types.ObjectId(templateId),
      'channels.name': channel
    });
    if (!templateChannelDetails) {
      throw new HttpException('Template channel details not found', HttpStatus.OK);
    }

    const channelData = templateChannelDetails.channels.find(
      (existingChannel) => existingChannel.name === channel
    );
    return channelData;
  }
}
