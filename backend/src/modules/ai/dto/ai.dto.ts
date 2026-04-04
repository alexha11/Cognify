import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  count?: number = 5;

  @IsString()
  @IsOptional()
  materialId?: string;
}
