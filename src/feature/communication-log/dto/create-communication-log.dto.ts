import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsMongoId, IsNumber } from 'class-validator';

export class CreateCommunicationLogDto {
  @IsMongoId()
  @IsNotEmpty()
  communication_id: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsOptional()
  attachment_details: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  type_id: number;

  @IsBoolean()
  @IsOptional()
  is_draft: boolean;

  @IsString()
  @IsOptional()
  status: string;

  @IsNumber()
  @IsOptional()
  rating: string;
}
