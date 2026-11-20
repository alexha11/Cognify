import { IsString, IsNotEmpty, IsIn, MaxLength } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class CreateRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

export class UpdateRoleRequestStatusDto {
  @IsIn([RequestStatus.APPROVED, RequestStatus.REJECTED])
  status: 'APPROVED' | 'REJECTED';
}
