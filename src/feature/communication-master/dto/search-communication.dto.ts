import { IsArray, IsOptional, IsString } from 'class-validator';

export class SearchCommunicationDto {
  @IsString()
  readonly category_id: string;

  @IsString()
  readonly sub_category_id: string;

  @IsString()
  @IsOptional()
  readonly id?: string;

  @IsArray()
  @IsOptional()
  readonly mode_id?: string[];

  @IsString()
  @IsOptional()
  readonly destination?: string;
}
