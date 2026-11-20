import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateAttemptDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  selectedAnswerIds: string[];
}
