import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, InviteUserDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new organization with admin user
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<any> {
    return this.authService.register(dto);
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
   * Invite a new user to the organization
   * POST /auth/invite
   * Only admins can invite users
   */
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async inviteUser(
    @Body() dto: InviteUserDto,
    @CurrentUser('organizationId') organizationId: string,
  ): Promise<any> {
    return this.authService.inviteUser(dto, organizationId);
  }
}
