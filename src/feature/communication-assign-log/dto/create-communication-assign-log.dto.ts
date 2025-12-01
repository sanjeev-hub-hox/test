import { IsString, IsNotEmpty, IsDate, IsMongoId } from 'class-validator';

export class CreateCommunicationAssignLogDto {
  @IsMongoId()
  @IsNotEmpty()
  communication_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
