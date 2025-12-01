import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject
} from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCommunicationDto {
  @IsString()
  @IsOptional()
  parent_id: string;

  @IsString()
  @IsNotEmpty()
  communication_master_id: string;

  @IsString()
  @IsOptional()
  communication: string;

  @IsString()
  @IsOptional()
  assign_to: string;

  @IsString()
  @IsOptional()
  reviewer_id: string;

  @IsDate()
  @IsOptional()
  date: Date;

  @IsString()
  @IsOptional()
  time: string;

  @IsString()
  @IsOptional()
  priority_id: string;

  @IsString()
  @IsOptional()
  tat: string;

  @IsBoolean()
  @IsNotEmpty()
  status: string;

  @IsBoolean()
  @IsNotEmpty()
  is_published: boolean;

  @IsString()
  @IsNotEmpty()
  created_by: string;

  @IsNumber()
  @IsOptional()
  student_id: number;

  @IsString()
  @IsOptional()
  ticket_number: string;

  @IsString()
  @IsNotEmpty()
  ticket_title: string;

  @IsString()
  @IsOptional()
  attachment?: string;

  @IsString()
  @IsOptional()
  lobs: string;

  @IsArray()
  @IsOptional()
  mode_ids: string[];

  @IsBoolean()
  @IsNotEmpty()
  is_response_required: boolean;

  @IsString()
  @IsOptional()
  form_slug?: string;

  @IsDate()
  @IsOptional()
  start_date: Date;

  @IsDate()
  @IsOptional()
  end_date: Date;

  @IsObject()
  @IsOptional()
  params: object;

  @IsOptional()
  is_picked: boolean;

  @IsOptional()
  otherSubCategory: string;

  @IsOptional()
  group_id: number[];

  @IsOptional()
  cc_group_id: number;

  @IsOptional()
  userId: string;

  @IsOptional()
  parentIds: number[];

  @IsOptional()
  is_deleted: number;

  @IsOptional()
  deleted_by: string;

  @IsArray()
  @IsOptional()
  mode: string[];

  @IsOptional()
  mode_value: string[];

  @IsArray()
  @IsOptional()
  school_ids: number[];

  @IsArray()
  @IsOptional()
  destination: string;
}
export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  communication_master_id: string;

  @IsString()
  @IsNotEmpty()
  communication: string;

  @IsDate()
  @IsOptional()
  date: Date;

  @IsString()
  @IsOptional()
  time: string;

  @IsString()
  @IsOptional()
  priority_id: string;

  @IsString()
  @IsOptional()
  ticket_number: string;

  @IsString()
  @IsNotEmpty()
  created_by: string;

  @IsString()
  @IsNotEmpty()
  ticket_title: string;

  @IsArray()
  @IsOptional()
  attachment?: any;

  @IsArray()
  @IsOptional()
  attachmentFiles?: any;

  @IsBoolean()
  @IsNotEmpty()
  published_date: Date;

  @IsDate()
  @IsNotEmpty()
  end_date: Date;

  @IsObject()
  @IsOptional()
  params: object;

  @IsArray()
  @IsOptional()
  mode_ids: string[];

  @IsOptional()
  is_response_required: boolean;

  @IsOptional()
  group_id: any;

  @IsOptional()
  otherSubCategory: string;

  @IsOptional()
  userId: string;

  @IsOptional()
  cc_group_id: number;

  @IsOptional()
  to: string;

  @IsOptional()
  individualType: string;

  @IsArray()
  @IsOptional()
  individualParents: any;

  @IsArray()
  @IsOptional()
  mode: string[];

  @IsOptional()
  mode_value: string[];

  @IsArray()
  @IsOptional()
  school_ids: number[];

  @IsArray()
  @IsOptional()
  destination: string;
}

export class FilterValueDto {
  @ApiProperty({ description: 'Operation to apply', example: 'equals' })
  @IsString()
  operation: string;

  @ApiProperty({
    description: 'Values to filter by',
    type: [String],
    example: [1, 2]
  })
  @IsArray()
  value: [];
}

export class FilterDto {
  @ApiProperty({ type: String, description: 'Search' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ type: Number, description: 'Page Size ' })
  pageSize: number;

  @ApiProperty({ type: Number, description: 'Page' })
  page: number;

  @ApiProperty({ type: Boolean, description: 'Draft', default: false })
  @IsBoolean()
  @IsOptional()
  isDraft: boolean;

  @ApiProperty({
    description: 'Category',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  category_id?: FilterValueDto;

  @IsOptional()
  group_id?: number;

  @ApiProperty({
    description: 'Sub Category',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  sub_category_id?: FilterValueDto;

  @ApiProperty({
    description: 'Communication Type',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  type?: FilterValueDto;

  @ApiProperty({
    description: 'Sub Type',
    type: FilterValueDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterValueDto)
  sub_type_id?: FilterValueDto;

  @ApiProperty({ type: Number, description: 'Created By' })
  @IsNumber()
  @IsOptional()
  created_by: number;

  @ApiProperty({ type: Number, description: 'Assign To' })
  @IsNumber()
  @IsOptional()
  assign_to: number;

  @ApiProperty({ type: Number, description: 'Student ID' })
  @IsNumber()
  @IsOptional()
  student_id: number;

  @ApiProperty({ type: Number, description: 'User ID' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'School IDs', default: [] })
  @IsArray()
  @IsOptional()
  school_ids: number[];
}
