import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  /** Only web links; `javascript:` and other schemes are rejected. */
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fileType: string;

  @IsInt()
  @Min(0)
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class UploadMaterialDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
