import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto, UpdateProgressDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  /**
   * Submit an answer
   * POST /attempts
   */
  @Post()
  async create(
    @Body() dto: CreateAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.attemptsService.create(
      dto,
      user.userId,
    );
  }

  /**
   * Get active quiz session progress for a course
   * GET /attempts/progress/:courseId
   */
  @Get('progress/:courseId')
  async getQuizProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.attemptsService.getQuizProgress(user.userId, courseId);
  }

  /**
   * Update active quiz session progress
   * POST /attempts/progress/:courseId
   */
  @Post('progress/:courseId')
  async updateQuizProgress(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.attemptsService.updateQuizProgress(user.userId, courseId, dto);
  }

  /**
   * Reset active quiz session progress for retaking
   * POST /attempts/reset/:courseId
   */
  @Post('reset/:courseId')
  async resetQuizProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.attemptsService.resetQuizProgress(user.userId, courseId);
  }

  /**
   * Get my attempt history
   * GET /attempts/me
   */
  @Get('me')
  async findMyAttempts(@CurrentUser() user: AuthenticatedUser): Promise<any[]> {
    return this.attemptsService.findByUser(user.userId);
  }

  /**
   * Get my statistics
   * GET /attempts/stats
   */
  @Get('stats')
  async getStats(@CurrentUser() user: AuthenticatedUser): Promise<any> {
    return this.attemptsService.getOverallStats(
      user.userId,
    );
  }

  /**
   * Get course progress
   * GET /attempts/course/:courseId
   */
  @Get('course/:courseId')
  async getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.attemptsService.getCourseProgress(
      courseId,
      user.userId,
    );
  }
}
