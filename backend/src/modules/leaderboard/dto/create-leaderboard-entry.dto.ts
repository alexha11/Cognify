import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateLeaderboardEntryDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsInt()
  @Min(0)
  score: number;

  @IsInt()
  @Min(1)
  totalQuestions: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  guestName?: string;
}
