import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { CreateRoleRequestDto, UpdateRoleRequestStatusDto } from './dto/role-request.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('access-control')
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  /**
   * Submit instructor access request
   */
  @Post('request-role')
  @UseGuards(JwtAuthGuard)
  async submitRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoleRequestDto,
  ) {
    return this.accessControlService.createRequest(user.userId, dto);
  }

  /**
   * Get my latest request status
   */
  @Get('my-request')
  @UseGuards(JwtAuthGuard)
  async getMyRequest(@CurrentUser() user: AuthenticatedUser) {
    return this.accessControlService.getMyRequest(user.userId);
  }

  /**
   * List all requests (Admin only)
   */
  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllRequests() {
    return this.accessControlService.findAllRequests();
  }

  /**
   * Approve/Reject request (Admin only)
   */
  @Patch('requests/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRequestStatusDto,
  ) {
    return this.accessControlService.updateRequestStatus(id, dto);
  }
}
