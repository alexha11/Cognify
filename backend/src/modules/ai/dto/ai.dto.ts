import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  topic: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  count?: number = 5;

  /** Must belong to `courseId`. */
  @IsString()
  @IsOptional()
  materialId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(DIFFICULTIES)
  difficulty?: (typeof DIFFICULTIES)[number];
}
