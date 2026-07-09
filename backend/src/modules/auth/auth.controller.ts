import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ResendCodeDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Config>,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  /**
   * Verify email OTP
   * POST /auth/verify-email
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<any> {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  /**
   * Resend OTP code
   * POST /auth/resend-code
   */
  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() dto: ResendCodeDto): Promise<any> {
    return this.authService.resendVerificationCode(dto.email);
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<any> {
    return this.authService.login(dto);
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  /**
   * Update current user profile
   * PUT /auth/profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }


  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Passport redirects to Google automatically
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const googleUser = req.user as {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
    };

    const result = await this.authService.validateGoogleUser(googleUser);
    const frontendUrl = this.configService.get('app.frontendUrl', { infer: true }) || 'http://localhost:3000';

    // Redirect to frontend callback page with the token
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }
}
