import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto, UpdateProgressDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  /** POST /attempts — score an answer. */
  @Post()
  create(
    @Body() dto: CreateAttemptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.create(dto, user);
  }

  /** GET /attempts/user-progress — all my saved quiz positions. */
  @Get('user-progress')
  getUserQuizProgresses(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.getUserQuizProgresses(user.userId);
  }

  /** GET /attempts/analytics — every learner's results in the caller's courses. */
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  getCourseAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.getCourseAnalytics(user);
  }

  /** GET /attempts/progress/:courseId — read-only; never creates a row. */
  @Get('progress/:courseId')
  getQuizProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.getQuizProgress(user, courseId);
  }

  /** POST /attempts/progress/:courseId — save position and completion. */
  @Post('progress/:courseId')
  updateQuizProgress(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.updateQuizProgress(user, courseId, dto);
  }

  /** POST /attempts/reset/:courseId — start the quiz again (attempts are kept). */
  @Post('reset/:courseId')
  resetQuizProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.resetQuizProgress(user, courseId);
  }

  /** GET /attempts/me */
  @Get('me')
  findMyAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.findByUser(user.userId);
  }

  /** GET /attempts/stats */
  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.getOverallStats(user.userId);
  }

  /** GET /attempts/course/:courseId — the caller's own progress in one course. */
  @Get('course/:courseId')
  getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attemptsService.getCourseProgress(courseId, user);
  }
}
