import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateQuestionsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Generate AI questions
   * POST /ai/generate-questions
   */
  @Post('generate-questions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async generateQuestions(
    @Body() dto: GenerateQuestionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiService.generateQuestions(
      dto.courseId,
      dto.topic,
      dto.count || 5,
      user.userId,
      user.organizationId || '',
      dto.materialId,
    );
  }
}
