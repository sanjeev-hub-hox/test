import { Controller, Post, Get, Res, HttpStatus, Body } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CommunicationFormService } from '../service';
import { RequestValidationError } from '../../../middleware';
import { CreateCommunicationFormDto } from '../dto';
import { ResponseService } from 'utils';

@ApiTags('Communication Form APIs')
@Controller('communication-form')
export class CommunicationFormController {
  constructor(
    private communicationFormService: CommunicationFormService,
    private responseService: ResponseService
  ) {}

  /**
   * Get communication by id
   */
  // @Get()
  // @ApiOkResponse({
  //   status: HttpStatus.OK,
  //   description: 'Success response',
  //   type: CreateRoleCategoryMappingResponse
  // })
  // @ApiBadRequestResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Validation error',
  //   type: RequestValidationError
  // })
  // @ApiOperation({ summary: 'Fetching Category Data based on HRIS Unique Role Code' })
  // async getCategoryData(@Res() res: Response, @Query() query: any) {
  //   let roleCategoryMappings: TRoleCategoryMapping[];
  //   try {
  //     roleCategoryMappings = await this.roleCategoryMappingService.findByHrisUniqueRoleCode(
  //       query?.hrisUniqueRoleCode
  //     );
  //   } catch (error: Error | unknown) {
  //     return this.responseService.sendResponse(
  //       res,
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       {},
  //       'Internal Server Error'
  //     );
  //   }

  //   const categoryIds: number[] = roleCategoryMappings.map((mapping) => mapping.category_id);

  //   try {
  //     console.debug('Category IDs:', categoryIds);
  //     console.log('Fetching MDM data for category IDs:', categoryIds);

  //     const categoryData = await this.roleCategoryMappingService.getMdmDataByIds(
  //       categoryIds,
  //       COMMUNICATION_CATEGORY
  //     );
  //     console.log('Category data fetched successfully');
  //     console.debug(`Category data: ${categoryData}`);

  //     return this.responseService.sendResponse(
  //       res,
  //       HttpStatus.OK,
  //       categoryData,
  //       'Category data fetched successfully'
  //     );
  //   } catch (error: Error | unknown) {
  //     return this.responseService.sendResponse(
  //       res,
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       {},
  //       'Internal Server Error'
  //     );
  //   }
  // }

  /**
   * Submit Communication Form
   */
  @Post('submit')
  @ApiOkResponse({
    status: HttpStatus.CREATED,
    description: 'Success response'
    // type: any
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: RequestValidationError
  })
  @ApiOperation({ summary: 'Creating Communication Form' })
  async submitForm(@Body() body: CreateCommunicationFormDto, @Res() res: Response) {
    try {
      const result: any = await this.communicationFormService.submitForm(body);

      if (result.errorMessage) {
        return this.responseService.sendResponse(
          res,
          HttpStatus.BAD_REQUEST,
          result,
          result.errorMessage
        );
      } else {
        return this.responseService.sendResponse(
          res,
          HttpStatus.CREATED,
          result,
          ' Communication Form submitted successfully'
        );
      }
    } catch (error: Error | unknown) {
      return this.responseService.sendResponse(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        {},
        'Internal Server Error'
      );
    }
  }
}
