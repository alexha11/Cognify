import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UpdateProfileDto,
} from './dto';
import { JwtPayload } from './interfaces';
import { Role, User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import {
  BCRYPT_SALT_ROUNDS,
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
} from '../../common/constants';

/**
 * A real bcrypt hash (of a value nobody can supply) compared against when the
 * submitted email has no password on file. This keeps the cost of a failed
 * login identical to a successful one, closing the timing side-channel that
 * would otherwise enumerate registered addresses.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$12$tO0q520ZVV6oRerS.MXKteT3dy2hiSXJKEOAiphWPSOhK95Psdsr6';

/** Fields needed to generate a JWT token. */
export interface TokenUser {
  id: string;
  email: string;
  role: Role;
}

/** Shape returned from user-facing endpoints. */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user and send OTP verification email.
   * Returns a message instead of a JWT — user must verify email first.
   */
  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.isEmailVerified) {
      throw new ConflictException('Email already registered');
    }

    // An account that was created through Google is a real, mailbox-verified
    // account even before it has a password. Treating it as "unverified" and
    // letting this unauthenticated endpoint overwrite its credentials would
    // hand an attacker a way to clobber a live user's profile and password.
    if (existingUser?.googleId) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    let user: User;

    if (existingUser) {
      // Genuine re-registration: a password signup that never completed
      // verification. Refresh the pending details and re-send the code.
      user = await this.prisma.user.update({
        where: { email: dto.email },
        data: {
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    } else {
      // Create User Only
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role || Role.STUDENT,
        },
      });
    }

    // Generate and store a 6-digit OTP
    await this.sendOtpToUser(user.id, dto.email);

    return {
      message: 'Verification code sent to your email',
      email: dto.email,
    };
  }

  /**
   * Verify the OTP code submitted by the user.
   * Activates the account and returns a JWT.
   */
  async verifyEmail(email: string, code: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { emailVerification: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verification = user.emailVerification;

    if (!verification) {
      throw new BadRequestException(
        'No verification code found. Please register again.',
      );
    }

    if (new Date() > verification.expiresAt) {
      await this.prisma.emailVerification.delete({
        where: { userId: user.id },
      });
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    if (!this.codesMatch(verification.code, code)) {
      // Burn one attempt. Once the budget is exhausted the code is destroyed,
      // which caps a brute-force run at OTP_MAX_ATTEMPTS guesses per issued
      // code instead of the full 10^6 keyspace. This is enforced per record,
      // so rotating source IPs does not help an attacker.
      const { attempts } = await this.prisma.emailVerification.update({
        where: { userId: user.id },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      });

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.prisma.emailVerification.delete({
          where: { userId: user.id },
        });
        throw new BadRequestException(
          'Too many incorrect attempts. Please request a new verification code.',
        );
      }

      throw new BadRequestException('Invalid verification code');
    }

    // Activate the user and remove the verification record
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.emailVerification.delete({ where: { userId: user.id } });
      return tx.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    });

    const token = this.generateToken(updatedUser);

    return {
      accessToken: token,
      user: this.toUserResponse(updatedUser),
    };
  }

  /**
   * Resend a fresh OTP code to the user's email.
   */
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendOtpToUser(user.id, user.email);

    return { message: 'A new verification code has been sent to your email' };
  }

  /**
   * Generate a 6-digit OTP, upsert it in the database, and send the email.
   */
  private async sendOtpToUser(userId: string, email: string): Promise<void> {
    // `crypto.randomInt` is a CSPRNG. `Math.random()` is not: V8's internal
    // state is recoverable from a handful of observed outputs, which would let
    // an attacker predict other users' codes after harvesting a few of their own.
    const max = 10 ** OTP_LENGTH;
    const code = randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.emailVerification.upsert({
      where: { userId },
      // Issuing a fresh code resets the failure budget.
      update: { code, expiresAt, attempts: 0 },
      create: { userId, code, expiresAt },
    });

    await this.emailService.sendVerificationEmail(email, code);
  }

  /**
   * Constant-time comparison of two OTP codes, so response latency does not
   * leak how many leading digits were correct.
   */
  private codesMatch(expected: string, provided: string): boolean {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');

    // timingSafeEqual throws on length mismatch; a length difference is not
    // secret here (the code is always OTP_LENGTH digits).
    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }

  /**
   * Authenticate user and return JWT token
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always run a bcrypt comparison, even for unknown emails or Google-only
    // accounts, so response time does not reveal whether the address exists.
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !user.passwordHash || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account-state messages are deliberately checked *after* the password is
    // proven. Surfacing them earlier would confirm to an unauthenticated
    // stranger that a given address is registered.
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before signing in. Check your inbox for the verification code.',
      );
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: this.toUserResponse(user),
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toUserResponse(user);
  }

  /**
   * Update current user profile
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthResponseDto> {
    // Only self-editable display fields are writable here. `role` is not
    // accepted — promotion happens exclusively through the access-control
    // approval flow.
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
      },
    });

    // Re-issue so the cookie reflects the current profile (and resets its TTL).
    const token = this.generateToken(updatedUser);

    return {
      accessToken: token,
      user: this.toUserResponse(updatedUser),
    };
  }

  /**
   * Generate JWT token with user context
   */
  private generateToken(user: TokenUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Map a User entity to the public-facing user response shape.
   */
  private toUserResponse(
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>,
  ): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  /**
   * Find or create a user from a Google OAuth profile.
   * - If a user with the same googleId exists, return them.
   * - If a user with the same email exists, link the googleId to their account.
   * - Otherwise, create a brand-new user.
   */
  async validateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponseDto> {
    // Linking by email is only safe if Google actually owns and verified the
    // address. Without this check an unverified alias could be used to seize
    // an existing Cognify account.
    if (!googleProfile.emailVerified) {
      throw new UnauthorizedException(
        'Your Google account email is not verified.',
      );
    }

    // 1. Try to find by googleId first
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    if (!user) {
      // 2. Try to find by email (link existing account)
      const existing = await this.prisma.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (existing) {
        // Link the google id to the existing account. Completing a Google sign-in
        // proves mailbox control, so this also settles any pending email
        // verification on that account.
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: { googleId: googleProfile.googleId, isEmailVerified: true },
        });
      } else {
        // 3. Create a brand-new user
        user = await this.prisma.user.create({
          data: {
            email: googleProfile.email,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            googleId: googleProfile.googleId,
            // Google has verified the mailbox; no OTP round-trip needed.
            isEmailVerified: true,
            role: Role.STUDENT,
          },
        });
      }
    }

    // Mirrors the password login path. Without this, a deactivated user could
    // simply click "Continue with Google" to bypass their ban.
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: this.toUserResponse(user),
    };
  }
}
