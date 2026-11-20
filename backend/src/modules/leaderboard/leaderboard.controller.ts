import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeaderboardService } from './leaderboard.service';
import { CreateLeaderboardEntryDto } from './dto';
import { OptionalJwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';

@Controller('leaderboard')
@UseGuards(OptionalJwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /** GET /leaderboard/:courseId — private courses answer 404 to outsiders. */
  @Get(':courseId')
  getLeaderboard(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.leaderboardService.getLeaderboard(courseId, user);
  }

  /** POST /leaderboard — guests and signed-in users. */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  submitEntry(
    @Body() dto: CreateLeaderboardEntryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.leaderboardService.submitEntry(dto, user);
  }
}
