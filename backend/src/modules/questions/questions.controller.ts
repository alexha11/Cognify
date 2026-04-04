import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * Create a new question
   * POST /questions
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async create(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.questionsService.create(
      dto,
      user.userId,
      user.organizationId || '',
    );
  }

  /**
   * Get questions for a course
   * GET /questions/course/:courseId
   */
  @Get('course/:courseId')
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<any[]> {
    return this.questionsService.findByCourse(
      courseId,
      user?.organizationId,
      user?.role,
    );
  }

  /**
   * Get pending approval questions
   * GET /questions/pending
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async getPendingApproval(
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.questionsService.getPendingApproval(organizationId);
  }

  /**
   * Get single question
   * GET /questions/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    return this.questionsService.findOne(id, organizationId);
  }

  /**
   * Update question
   * PUT /questions/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.questionsService.update(id, dto, user.organizationId || '');
  }

  /**
   * Approve AI question
   * POST /questions/:id/approve
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async approve(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string | undefined,
  ) {
    return this.questionsService.approve(id, organizationId || '');
  }

  /**
   * Delete question
   * DELETE /questions/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.questionsService.remove(id, user.organizationId || '');
  }
}
