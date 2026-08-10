import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * Roles a user may assign to themselves at sign-up. ADMIN is deliberately
 * excluded — it can only be granted by an existing admin. INSTRUCTOR remains
 * self-service to match the existing product flow.
 */
export const SELF_ASSIGNABLE_ROLES = [Role.STUDENT, Role.INSTRUCTOR] as const;

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsIn(SELF_ASSIGNABLE_ROLES as unknown as Role[], {
    message: 'role must be one of: STUDENT, INSTRUCTOR',
  })
  @IsOptional()
  role?: Role;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

/**
 * Internal result of a successful authentication. The token is set as an
 * HttpOnly cookie by the controller and never serialised into a response body,
 * so it stays out of logs, browser history and `localStorage`.
 */
export class AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
}

/** What the client actually receives on sign-in. */
export class SessionResponseDto {
  user: UserResponseDto;
}

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits' })
  code: string;
}

export class ResendCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @Length(1, 100)
  lastName?: string;

  // `role` is intentionally absent. Accepting it here let any authenticated
  // user promote themselves to ADMIN with a single request. Role changes go
  // through the access-control request/approval flow instead.
}
