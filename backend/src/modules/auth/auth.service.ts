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
import { PrismaService } from '../../prisma';
import { RegisterDto, LoginDto, AuthResponseDto, UpdateProfileDto } from './dto';
import { JwtPayload } from './interfaces';
import { Role } from '@prisma/client';
import { EmailService } from '../email/email.service';

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
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.isEmailVerified) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;

    if (existingUser && !existingUser.isEmailVerified) {
      // Re-registration attempt for unverified user — update their info and resend code
      user = await this.prisma.user.update({
        where: { email: dto.email },
        data: { passwordHash, firstName: dto.firstName, lastName: dto.lastName },
      });
    } else {
      // Flow 2: Create User Only
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: (dto as any).role || Role.STUDENT,
        } as any,
      });
    }

    // Generate and store a 6-digit OTP
    await this.sendOtpToUser(user.id, dto.email);

    return { message: 'Verification code sent to your email', email: dto.email };
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
      throw new BadRequestException('No verification code found. Please register again.');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (verification.code !== code) {
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
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.emailVerification.upsert({
      where: { userId },
      update: { code, expiresAt },
      create: { userId, code, expiresAt },
    });

    await this.emailService.sendVerificationEmail(email, code);
  }

  /**
   * Authenticate user and return JWT token
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before signing in. Check your inbox for the verification code.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user as any);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }


  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
    };
  }> {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.role && { role: dto.role }),
      },
    });

    const token = this.generateToken(updatedUser as any);

    return {
      accessToken: token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
      },
    };
  }

  /**
   * Generate JWT token with organization context
   */
  private generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
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
    firstName: string;
    lastName: string;
  }): Promise<AuthResponseDto> {
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
        // Link the google id to the existing account
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: { googleId: googleProfile.googleId },
        });
      } else {
        // 3. Create a brand-new user
        user = await this.prisma.user.create({
          data: {
            email: googleProfile.email,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            googleId: googleProfile.googleId,
            role: Role.STUDENT,
          },
        });
      }
    }

    const token = this.generateToken(user as any);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
