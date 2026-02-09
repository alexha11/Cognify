import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateRoleRequestStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'APPROVED' | 'REJECTED';
}
