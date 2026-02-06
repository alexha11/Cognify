import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class CreateCheckoutDto {
  @IsEnum(['PRO', 'ENTERPRISE'])
  @IsNotEmpty()
  plan: 'PRO' | 'ENTERPRISE';

  @IsString()
  @IsNotEmpty()
  successUrl: string;

  @IsString()
  @IsNotEmpty()
  cancelUrl: string;
}

export class CreatePortalDto {
  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}
