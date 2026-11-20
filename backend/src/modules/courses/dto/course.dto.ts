import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateVisibilityDto {
  @IsBoolean()
  isPublic: boolean;
}

export class AddPrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  prerequisiteId: string;
}
