import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateAttemptDto } from './dto';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit an answer attempt
   * Validates question and answer belong to user's organization
   */
  async create(dto: CreateAttemptDto, userId: string, organizationId: string) {
    // Verify question exists and belongs to organization
    const question = await this.prisma.question.findFirst({
      where: {
        id: dto.questionId,
        approved: true,
        course: { organizationId },
      },
      include: {
        answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify answer belongs to question
    const answer = question.answers.find((a) => a.id === dto.selectedAnswerId);
    if (!answer) {
      throw new ForbiddenException('Invalid answer for this question');
    }

    // Check if already answered
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        userId,
        questionId: dto.questionId,
      },
    });

    if (existingAttempt) {
      throw new ForbiddenException('You have already answered this question');
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        userId,
        questionId: dto.questionId,
        selectedAnswerId: dto.selectedAnswerId,
        isCorrect: answer.isCorrect,
      },
      include: {
        question: {
          include: {
            answers: true,
          },
        },
        selectedAnswer: true,
      },
    });

    return {
      id: attempt.id,
      isCorrect: attempt.isCorrect,
      selectedAnswer: attempt.selectedAnswer,
      correctAnswer: question.answers.find((a) => a.isCorrect),
      hint: question.hint,
      question: {
        id: question.id,
        content: question.content,
      },
    };
  }

  /**
   * Get user's attempt history
   */
  async findByUser(userId: string): Promise<any[]> {
    return this.prisma.attempt.findMany({
      where: { userId },
      include: {
        question: true,
        selectedAnswer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get attempt statistics for user
   */
  async getOverallStats(userId: string, organizationId: string): Promise<any> {
    const attempts = await this.prisma.attempt.findMany({
      where: {
        userId,
        question: {
          course: { organizationId },
        },
      },
      select: {
        isCorrect: true,
        question: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;

    // Group by course
    const byCourse = attempts.reduce(
      (acc, attempt) => {
        const courseId = attempt.question.courseId;
        if (!acc[courseId]) {
          acc[courseId] = { total: 0, correct: 0 };
        }
        acc[courseId].total++;
        if (attempt.isCorrect) {
          acc[courseId].correct++;
        }
        return acc;
      },
      {} as Record<string, { total: number; correct: number }>,
    );

    return {
      overall: {
        total,
        correct,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      },
      byCourse,
    };
  }

  /**
   * Get course progress for user
   */
  async getCourseProgress(
    courseId: string,
    userId: string,
    organizationId: string,
  ) {
    // Verify course belongs to organization
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, organizationId },
      include: {
        questions: {
          where: { approved: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalQuestions = course.questions.length;

    const attempts = await this.prisma.attempt.findMany({
      where: {
        userId,
        questionId: { in: course.questions.map((q) => q.id) },
      },
    });

    const answered = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;

    return {
      courseId,
      courseName: course.name,
      totalQuestions,
      answered,
      correct,
      remaining: totalQuestions - answered,
      percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
    };
  }
}
