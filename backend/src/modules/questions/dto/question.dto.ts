import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  hint?: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  @ArrayMinSize(2, { message: 'At least 2 answers are required' })
  answers: CreateAnswerDto[];
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  hint?: string;

  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsOptional()
  count?: number;
}
