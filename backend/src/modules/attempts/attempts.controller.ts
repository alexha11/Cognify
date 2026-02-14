import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto';
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
    return this.attemptsService.create(dto, user.userId, user.organizationId || "");
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
    return this.attemptsService.getOverallStats(user.userId, user.organizationId || "");
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
    return this.attemptsService.getCourseProgress(courseId, user.userId, user.organizationId || "");
  }
}
