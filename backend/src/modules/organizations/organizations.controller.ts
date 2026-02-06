import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * Get current organization details
   * GET /organizations/me
   */
  @Get('me')
  async getMyOrganization(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.organizationsService.findOne(user.organizationId);
  }

  /**
   * Get all users in organization
   * GET /organizations/users
   */
  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUsers(@CurrentUser('organizationId') organizationId: string): Promise<any[]> {
    return this.organizationsService.getUsers(organizationId);
  }

  /**
   * Update organization
   * PUT /organizations/me
   */
  @Put('me')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<any> {
    return this.organizationsService.update(organizationId, dto);
  }

  /**
   * Get plan limits
   * GET /organizations/limits
   */
  @Get('limits')
  async getPlanLimits(@CurrentUser('organizationId') organizationId: string) {
    const org = await this.organizationsService.getMyOrganization(organizationId);
    return this.organizationsService.getPlanLimits(org.plan);
  }
}
