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
import {
  AddPrerequisiteDto,
  CreateCourseDto,
  UpdateCourseDto,
  UpdateVisibilityDto,
} from './dto';
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

  /** POST /courses */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.create(dto, user.userId);
  }

  /** GET /courses — public courses, plus your own (instructors) or all (admins). */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@CurrentUser() user?: AuthenticatedUser) {
    return this.coursesService.findAll(user);
  }

  /** GET /courses/:id — private courses answer 404 to anyone but their owner. */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.coursesService.findOne(id, user);
  }

  /** PUT /courses/:id */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.update(id, dto, user);
  }

  /** PATCH /courses/:id/visibility */
  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateVisibilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.updateVisibility(id, dto.isPublic, user);
  }

  /** DELETE /courses/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.remove(id, user);
  }

  /** POST /courses/:id/prerequisites */
  @Post(':id/prerequisites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  addPrerequisite(
    @Param('id') id: string,
    @Body() dto: AddPrerequisiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.addPrerequisite(id, dto.prerequisiteId, user);
  }

  /** DELETE /courses/:id/prerequisites/:prerequisiteId */
  @Delete(':id/prerequisites/:prerequisiteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  removePrerequisite(
    @Param('id') id: string,
    @Param('prerequisiteId') prerequisiteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.removePrerequisite(id, prerequisiteId, user);
  }
}
