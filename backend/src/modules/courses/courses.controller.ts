import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
} from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * Create a new course
   * POST /courses
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.create(
      dto,
      user.userId,
      user.organizationId || '',
    );
  }

  /**
   * Get all courses
   * GET /courses
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@CurrentUser() user?: AuthenticatedUser): Promise<any[]> {
    console.log(
      '[CoursesController] GET /courses - user:',
      user?.userId,
      'role:',
      user?.role,
      'orgId:',
      user?.organizationId,
    );
    return this.coursesService.findAll(user?.organizationId, user?.role);
  }

  /**
   * Get single course
   * GET /courses/:id
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.findOne(
      id,
      user?.organizationId,
      user?.role,
      user?.userId,
    );
  }

  /**
   * Update course
   * PUT /courses/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.update(
      id,
      dto,
      user.userId,
      user.organizationId || '',
      user.role,
    );
  }

  /**
   * Toggle course visibility (public/private)
   * PATCH /courses/:id/visibility
   */
  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async updateVisibility(
    @Param('id') id: string,
    @Body() dto: { isPublic: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.updateVisibility(
      id,
      dto.isPublic,
      user.userId,
      user.organizationId || '',
      user.role,
    );
  }

  /**
   * Delete course
   * DELETE /courses/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string | undefined,
  ): Promise<{ message: string }> {
    return this.coursesService.remove(id, organizationId || '');
  }

  /**
   * Add prerequisite to course
   * POST /courses/:id/prerequisites
   */
  @Post(':id/prerequisites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async addPrerequisite(
    @Param('id') id: string,
    @Body('prerequisiteId') prerequisiteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.addPrerequisite(
      id,
      prerequisiteId,
      user.organizationId || '',
      user.userId,
      user.role,
    );
  }

  /**
   * Remove prerequisite from course
   * DELETE /courses/:id/prerequisites/:prerequisiteId
   */
  @Delete(':id/prerequisites/:prerequisiteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async removePrerequisite(
    @Param('id') id: string,
    @Param('prerequisiteId') prerequisiteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.coursesService.removePrerequisite(
      id,
      prerequisiteId,
      user.organizationId || '',
      user.userId,
      user.role,
    );
  }
}
