import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CreateLeaderboardEntryDto } from './dto';
import { OptionalJwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * Get leaderboard for a course (public — no auth required)
   * GET /leaderboard/:courseId
   */
  @Get(':courseId')
  async getLeaderboard(@Param('courseId') courseId: string): Promise<any> {
    const [entries, courseName] = await Promise.all([
      this.leaderboardService.getLeaderboard(courseId),
      this.leaderboardService.getCourseName(courseId),
    ]);
    return { courseName, entries };
  }

  /**
   * Submit a leaderboard entry (optional auth — guests and users)
   * POST /leaderboard
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async submitEntry(
    @Body() dto: CreateLeaderboardEntryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<any> {
    return this.leaderboardService.submitEntry(dto, user?.userId);
  }
}
