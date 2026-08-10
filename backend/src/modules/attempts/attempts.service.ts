import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateAttemptDto, UpdateProgressDto } from './dto';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active quiz progress records for a user
   */
  async getUserQuizProgresses(userId: string) {
    return this.prisma.quizProgress.findMany({
      where: { userId },
    });
  }

  /**
   * Get active quiz progress for a user and course
   */
  async getQuizProgress(userId: string, courseId: string) {
    let progress = await this.prisma.quizProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!progress) {
      progress = await this.prisma.quizProgress.create({
        data: {
          userId,
          courseId,
          currentIndex: 0,
          isCompleted: false,
        },
      });
    }

    return progress;
  }

  /**
   * Update active quiz progress (current index and/or completion state)
   */
  async updateQuizProgress(
    userId: string,
    courseId: string,
    dto: UpdateProgressDto,
  ) {
    return this.prisma.quizProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        ...(dto.currentIndex !== undefined
          ? { currentIndex: dto.currentIndex }
          : {}),
        ...(dto.isCompleted !== undefined
          ? { isCompleted: dto.isCompleted }
          : {}),
      },
      create: {
        userId,
        courseId,
        currentIndex: dto.currentIndex ?? 0,
        isCompleted: dto.isCompleted ?? false,
      },
    });
  }

  /**
   * Reset quiz progress for retaking a course
   */
  async resetQuizProgress(userId: string, courseId: string) {
    return this.prisma.quizProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        currentIndex: 0,
        isCompleted: false,
      },
      create: {
        userId,
        courseId,
        currentIndex: 0,
        isCompleted: false,
      },
    });
  }

  /**
   * Submit an answer attempt
   */
  async create(dto: CreateAttemptDto, userId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: dto.questionId,
        approved: true,
      },
      include: {
        answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify all submitted answers belong to question
    const validAnswerIds = question.answers.map((a) => a.id);
    const isValid = dto.selectedAnswerIds.every((id) =>
      validAnswerIds.includes(id),
    );
    if (!isValid || dto.selectedAnswerIds.length === 0) {
      throw new ForbiddenException(
        'Invalid answers selected for this question',
      );
    }

    const correctAnswers = question.answers.filter((a) => a.isCorrect);
    const isCorrect =
      correctAnswers.length === dto.selectedAnswerIds.length &&
      correctAnswers.every((a) => dto.selectedAnswerIds.includes(a.id));

    // Check if already answered - if so, update the attempt instead of throwing
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        userId,
        questionId: dto.questionId,
      },
    });

    let attempt;
    if (existingAttempt) {
      // Update existing attempt for retry
      attempt = await this.prisma.attempt.update({
        where: { id: existingAttempt.id },
        data: {
          selectedAnswerIds: dto.selectedAnswerIds,
          isCorrect,
        },
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      });
    } else {
      // Create new attempt
      attempt = await this.prisma.attempt.create({
        data: {
          userId,
          questionId: dto.questionId,
          selectedAnswerIds: dto.selectedAnswerIds,
          isCorrect,
        },
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      });
    }

    // After success, check if course is completed
    if (attempt.isCorrect) {
      await this.checkAndMarkCompletion(userId, question.courseId);
    }

    return {
      id: attempt.id,
      isCorrect: attempt.isCorrect,
      selectedAnswerIds: attempt.selectedAnswerIds,
      correctAnswerIds: correctAnswers.map((a) => a.id),
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
  async findByUser(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      include: {
        question: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get attempt statistics for user
   */
  async getOverallStats(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: {
        userId,
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
  async getCourseProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
      },
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

    const percentage =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    // Also check if they officially have a completion record
    const isCompleted = percentage === 100;

    return {
      courseId,
      courseName: course.name,
      totalQuestions,
      answered,
      correct,
      remaining: totalQuestions - answered,
      percentage,
      isCompleted,
    };
  }

  /**
   * Check if all approved questions in a course are correctly answered.
   * Updates QuizProgress to mark the course as completed if all questions are correct.
   */
  async checkAndMarkCompletion(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        questions: {
          where: { approved: true },
          select: { id: true },
        },
      },
    });

    if (!course || course.questions.length === 0) return;

    const correctAttempts = await this.prisma.attempt.findMany({
      where: {
        userId,
        questionId: { in: course.questions.map((q) => q.id) },
        isCorrect: true,
      },
      select: { questionId: true },
    });

    const uniqueCorrectQuestions = new Set(
      correctAttempts.map((a) => a.questionId),
    );

    if (uniqueCorrectQuestions.size === course.questions.length) {
      // Mark quiz progress as completed
      await this.prisma.quizProgress.upsert({
        where: {
          userId_courseId: { userId, courseId },
        },
        update: { isCompleted: true },
        create: {
          userId,
          courseId,
          currentIndex: course.questions.length,
          isCompleted: true,
        },
      });

      this.logger.log(`User ${userId} completed course ${courseId}`);
    }
  }
}
