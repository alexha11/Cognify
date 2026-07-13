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
import { CreateQuestionDto, UpdateQuestionDto, BulkCreateQuestionDto } from './dto';
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
    );
  }

  /**
   * Create multiple new questions
   * POST /questions/bulk
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async createBulk(
    @Body() dto: BulkCreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.questionsService.createBulk(
      dto,
      user.userId,
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
      user?.role,
    );
  }

  /**
   * Get questions for a course publicly (no auth)
   * Returns questions with answers but strips isCorrect for anti-cheat
   * GET /questions/course/:courseId/public
   */
  @Get('course/:courseId/public')
  async findByCoursePublic(
    @Param('courseId') courseId: string,
  ): Promise<any> {
    return this.questionsService.findByCoursePublic(courseId);
  }

  /**
   * Get pending approval questions
   * GET /questions/pending
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async getPendingApproval() {
    return this.questionsService.getPendingApproval();
  }

  /**
   * Get single question
   * GET /questions/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.questionsService.findOne(id);
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
    return this.questionsService.update(id, dto);
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
  ) {
    return this.questionsService.approve(id);
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
    return this.questionsService.remove(id);
  }
}
