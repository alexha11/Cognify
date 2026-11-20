import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayNotEmpty,
  IsIn,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

export class CreateAnswerDto {
  /** Sent back by the edit dialog; ignored on create, answers get fresh ids. */
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  hint?: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'image'])
  contentType?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  @ArrayMinSize(2, { message: 'At least 2 answers are required' })
  @ArrayMaxSize(10)
  answers: CreateAnswerDto[];
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(5000)
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  hint?: string;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'image'])
  contentType?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  @ArrayMinSize(2, { message: 'At least 2 answers are required' })
  @ArrayMaxSize(10)
  answers?: CreateAnswerDto[];
}

export class BulkCreateQuestionDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

/**
 * Multipart fields sent with POST /questions/upload-image. `answers` arrives as
 * a JSON string and is parsed into validated answer objects.
 */
export class UploadQuestionImageDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  hint?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return plainToInstance(CreateAnswerDto, JSON.parse(value) as object[]);
    } catch {
      return value;
    }
  })
  @IsArray({ message: 'answers must be a JSON array' })
  @ValidateNested({ each: true })
  @ArrayMinSize(2, { message: 'At least 2 answers are required' })
  @ArrayMaxSize(10)
  answers: CreateAnswerDto[];
}

/** POST /questions/:id/check — grade one submission without saving it. */
export class CheckAnswerDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  selectedAnswerIds: string[];
}
