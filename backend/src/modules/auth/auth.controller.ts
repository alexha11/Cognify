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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendCodeDto,
  UpdateProfileDto,
  SessionResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import type { GoogleProfilePayload } from './strategies';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config';
import { AUTH_COOKIE_NAME } from '../../common/constants';
import type { CookieOptions, Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Config>,
  ) {}

  private get isProduction(): boolean {
    return (
      this.configService.get('app.nodeEnv', { infer: true }) === 'production'
    );
  }

  private get frontendUrl(): string {
    return (
      this.configService.get('app.frontendUrl', { infer: true }) ||
      'http://localhost:3000'
    );
  }

  /**
   * Cookie carrying the session JWT.
   *
   * - `httpOnly` keeps it unreadable from JavaScript, so an XSS bug can no
   *   longer exfiltrate a long-lived session token.
   * - `sameSite: 'lax'` is what makes this safe without CSRF tokens: browsers
   *   withhold the cookie on cross-site POST/PUT/DELETE. Every mutating
   *   endpoint in this API is non-GET, so none can be triggered cross-site.
   * - No `domain` is set on purpose — the cookie binds to the origin the
   *   browser sees (the frontend, which proxies /api here), so frontend and
   *   backend need not share a parent domain.
   */
  private authCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(AUTH_COOKIE_NAME, token, this.authCookieOptions());
  }

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    return this.authService.register(dto);
  }

  /**
   * Verify email OTP
   * POST /auth/verify-email
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponseDto> {
    const { accessToken, user } = await this.authService.verifyEmail(
      dto.email,
      dto.code,
    );
    this.setAuthCookie(res, accessToken);
    return { user };
  }

  /**
   * Resend OTP code
   * POST /auth/resend-code
   */
  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  // Tight: this endpoint sends email, so abuse costs real money and can be
  // used to flood a third party's inbox.
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  async resendCode(@Body() dto: ResendCodeDto): Promise<{ message: string }> {
    return this.authService.resendVerificationCode(dto.email);
  }

  /**
   * Login with email and password
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponseDto> {
    const { accessToken, user } = await this.authService.login(dto);
    this.setAuthCookie(res, accessToken);
    return { user };
  }

  /**
   * Clear the session
   * POST /auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    // Options (minus maxAge) must match those used to set it or the browser
    // will not remove the cookie.
    const options = this.authCookieOptions();
    delete options.maxAge;
    res.clearCookie(AUTH_COOKIE_NAME, options);
    return { message: 'Signed out' };
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponseDto> {
    const { accessToken, user: updated } = await this.authService.updateProfile(
      user.userId,
      dto,
    );
    this.setAuthCookie(res, accessToken);
    return { user: updated };
  }

  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Passport redirects to Google automatically
  }

  /**
   * Google OAuth callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const googleUser = req.user as GoogleProfilePayload;

    try {
      const { accessToken } =
        await this.authService.validateGoogleUser(googleUser);

      // The token goes in the cookie, never the URL. A token in a query string
      // ends up in browser history, proxy and server access logs, and the
      // Referer header of anything the landing page loads.
      this.setAuthCookie(res, accessToken);
      res.redirect(`${this.frontendUrl}/auth/callback`);
    } catch {
      // Deactivated account, unverified Google email, etc. Deliberately vague
      // to the browser; the specific reason stays server-side.
      res.redirect(`${this.frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
