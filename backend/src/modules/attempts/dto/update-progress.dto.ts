import { IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  currentIndex?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
