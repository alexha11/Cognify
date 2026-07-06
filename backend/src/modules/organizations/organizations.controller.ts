import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
} from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ============================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================

  /**
   * Get all public organizations for discovery
   * GET /organizations/public
   */
  @Get('public')
  async findAllPublic(): Promise<any[]> {
    return this.organizationsService.findAllPublic();
  }

  /**
   * Get organization by slug (with public courses)
   * GET /organizations/slug/:slug
   */
  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<any> {
    return this.organizationsService.findBySlug(
      slug,
      user?.userId,
      user?.organizationId,
    );
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS
  // ============================================

  /**
   * Create a new organization
   * POST /organizations
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<any> {
    return this.organizationsService.create(userId || '', dto);
  }

  /**
   * Get current organization details
   * GET /organizations/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyOrganization(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    if (!user.organizationId) {
      return null;
    }
    return this.organizationsService.findOne(user.organizationId);
  }

  /**
   * Get the current user's organization memberships
   * GET /organizations/memberships
   */
  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(
    @CurrentUser('userId') userId: string,
  ): Promise<any[]> {
    return this.organizationsService.getUserMemberships(userId);
  }

  /**
   * Get all users in organization
   * GET /organizations/users
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUsers(
    @CurrentUser('organizationId') organizationId: string,
  ): Promise<any[]> {
    return this.organizationsService.getUsers(organizationId);
  }

  /**
   * Update organization
   * PUT /organizations/me
   */
  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<any> {
    return this.organizationsService.update(organizationId, dto);
  }

  /**
   * Toggle organization visibility (public/private)
   * PATCH /organizations/visibility
   */
  @Patch('visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateVisibility(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: { isPublic: boolean },
  ): Promise<any> {
    return this.organizationsService.updateVisibility(
      organizationId,
      dto.isPublic,
    );
  }

  /**
   * Get plan limits
   * GET /organizations/limits
   */
  @Get('limits')
  @UseGuards(JwtAuthGuard)
  async getPlanLimits(@CurrentUser('organizationId') organizationId?: string) {
    if (!organizationId) {
      return this.organizationsService.getPlanLimits('FREE');
    }
    const org = await this.organizationsService.getMyOrganization(organizationId);
    return this.organizationsService.getPlanLimits(org.plan);
  }

  /**
   * Join an organization
   * POST /organizations/:id/join
   */
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinOrganization(
    @Param('id') organizationId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<any> {
    return this.organizationsService.joinOrganization(userId, organizationId);
  }

  /**
   * Leave an organization
   * DELETE /organizations/:id/leave
   */
  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveOrganization(
    @Param('id') organizationId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.organizationsService.leaveOrganization(userId, organizationId);
  }
}
