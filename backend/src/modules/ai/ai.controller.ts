import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateQuestionsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** POST /ai/generate-questions — drafts only; nothing is saved. */
  @Post('generate-questions')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  // Every call spends OpenRouter credit.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  generateQuestions(
    @Body() dto: GenerateQuestionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.generateQuestions(dto, user);
  }
}
