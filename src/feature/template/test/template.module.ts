import { Test } from '@nestjs/testing';
import { TemplateController } from '../template.controller';
import { TemplateRepository } from '../template.repository';
import { TemplateService } from '../template.service';
import { templateModel } from './template.model';
import { LoggerService, ResponseService } from '../../../utils';
import { templateMockedRepository } from './template.repository';

export const initTemplateTestModule = async () => {
  const templateTestModule = await Test.createTestingModule({
    controllers: [TemplateController],
    providers: [
      //   TemplateRepository,
      {
        provide: TemplateRepository,
        useValue: templateMockedRepository
      },
      {
        provide: 'templateModel',
        useFactory: () => templateModel
      },
      TemplateService,
      {
        provide: LoggerService,
        useValue: {
          log: jest.fn(),
          error: jest.fn()
        }
      },
      {
        provide: ResponseService,
        useValue: {
          sendResponse: jest.fn(),
          errorResponse: jest.fn()
        }
      }
    ]
  }).compile();

  const templateController: jest.MockedObject<TemplateController> =
    await templateTestModule.get(TemplateController);
  const templateRepository: jest.MockedObject<TemplateRepository> =
    await templateTestModule.get(TemplateRepository);
  const templateService: jest.MockedObject<TemplateService> =
    await templateTestModule.get(TemplateService);

  return {
    templateController,
    templateRepository,
    templateService
  };
};
