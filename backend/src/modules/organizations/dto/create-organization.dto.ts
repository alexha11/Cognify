import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
