import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAttemptDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  selectedAnswerId: string;
}
