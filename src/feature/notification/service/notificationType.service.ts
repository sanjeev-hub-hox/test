import { NotificationTypeDocument, NotificationTypeModel } from '../schema';
import { NotificationType } from '../dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class NotificationTypeService {
  constructor(
    @InjectModel('notificationType')
    private notificationTypeModel: NotificationTypeModel
  ) {}

  private paginatedQuery(
    filter: Record<string, unknown>,
    sort: string,
    sortBy: string,
    pageSize: number,
    pageNumber: number
  ): any[] {
    const aggregrateQuery = [];
    if (filter) {
      aggregrateQuery.push({
        $match: {
          ...filter,
          isActive: filter?.isActive && filter?.isActive === 'false' ? false : true
        }
      });
    }

    if (sort && sortBy) {
      aggregrateQuery.push({
        $sort: {
          [sortBy]: sort === 'asc' ? 1 : -1
        }
      });
    }

    return aggregrateQuery.concat([
      {
        $project: {
          _id: 0,
          __v: 0
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
    ]);
  }

  create(createData: NotificationType): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.create(createData);
  }

  createMany(createData: NotificationType[]): Promise<NotificationTypeDocument[]> {
    return this.notificationTypeModel.create(createData);
  }

  getOne(
    filter: Record<string, unknown>,
    project?: Record<string, number> | {}
  ): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.findOne(filter, { __v: 0, _id: 0, ...project });
  }

  getByObjectId(id: string): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.findById({ _id: id });
  }

  getMany(
    filter: Record<string, unknown>,
    sort: string,
    sortBy: string,
    pageSize: number,
    pageNumber: number
  ) {
    return this.notificationTypeModel.aggregate(
      this.paginatedQuery(filter, sort, sortBy, pageSize, pageNumber)
    );
  }

  updateByObjectId(
    id: string,
    updateData: Partial<NotificationTypeDocument>,
    getNewDocument: true
  ): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.findByIdAndUpdate({ _id: id }, updateData, {
      new: getNewDocument
    });
  }

  async updateOne<D>(
    filter: Record<string, unknown>,
    data: Partial<NotificationTypeDocument>,
    options: Record<string, unknown> = {}
  ): Promise<NotificationTypeDocument> {
    const response = await this.notificationTypeModel.findOneAndUpdate(filter, data, {
      projection: {
        __v: 0,
        _id: 0
      },
      returnDocument: 'after',
      ...options
    });
    return response;
  }

  async updateMany(
    filter: Record<string, unknown>,
    data: Partial<NotificationTypeDocument>[],
    options: Record<string, unknown> = {}
  ) {
    const response = await this.notificationTypeModel.updateMany(filter, data, options);
    return response;
  }

  deleteByObjectId(id: string): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.findByIdAndDelete({ _id: id });
  }

  deleteOne(filter: Record<string, unknown>): Promise<NotificationTypeDocument> {
    return this.notificationTypeModel.findOneAndDelete(filter, {
      projection: {
        __v: 0,
        _id: 0
      }
    });
  }

  deleteMany(filter: Record<string, unknown>) {
    return this.notificationTypeModel.deleteMany(filter);
  }
}
