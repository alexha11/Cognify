import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateAttemptDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  selectedAnswerIds: string[];
}
