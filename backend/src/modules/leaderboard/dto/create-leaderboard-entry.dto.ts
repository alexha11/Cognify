import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLeaderboardEntryDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  /**
   * Only used for guests, and capped at the course's question count. For
   * signed-in users the server computes the score from their attempts.
   */
  @IsInt()
  @Min(0)
  @Max(10_000)
  score: number;

  /** Accepted for compatibility; the server uses the real question count. */
  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuestions?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(30)
  guestName?: string;
}
