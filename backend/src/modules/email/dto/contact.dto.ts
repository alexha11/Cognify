import { IsString, IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}
