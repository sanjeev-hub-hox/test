import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty()
  @IsString()
  table_name?: string;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  request_body?: Record<string, any>;

  @ApiProperty({ type: Object, required: false })
  @IsOptional()
  @IsObject()
  response_body?: Record<string, any>;

  @ApiProperty()
  @IsString()
  operation_name?: string;

  @ApiProperty()
  created_by?: number;

  @ApiProperty()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiProperty({ type: String })
  method?: string;

  @ApiProperty()
  @IsString()
  source_service?: string;

  @ApiProperty()
  @IsString()
  record_id?: string;
}
