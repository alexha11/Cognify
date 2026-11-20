import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { CreateAttemptDto, UpdateProgressDto } from './dto';
import { CourseAccessService } from '../../common/access';
import { gradeSelection } from '../questions/questions.service';
import type { AuthenticatedUser } from '../auth/interfaces';

/** One row of the instructor analytics table. */
export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  isPublic: boolean;
  totalQuestions: number;
  /** Distinct users who answered at least one approved question. */
  learners: number;
  /** Answer rows across all learners (one per learner and question). */
  answered: number;
  correct: number;
  /** Learners whose quiz progress is marked complete. */
  completions: number;
  accuracy: number;
  completionRate: number;
}

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
  ) {}

  async getUserQuizProgresses(userId: string) {
    return this.prisma.quizProgress.findMany({ where: { userId } });
  }

  /**
   * Current quiz position. Reading never writes: a learner without a saved
   * position is simply at question 0 until they save one.
   */
  async getQuizProgress(user: AuthenticatedUser, courseId: string) {
    await this.access.assertCanView(courseId, user);

    const progress = await this.prisma.quizProgress.findUnique({
      where: { userId_courseId: { userId: user.userId, courseId } },
    });

    return (
      progress ?? {
        id: null,
        userId: user.userId,
        courseId,
        currentIndex: 0,
        isCompleted: false,
        lastAnsweredAt: null,
        createdAt: null,
      }
    );
  }

  async updateQuizProgress(
    user: AuthenticatedUser,
    courseId: string,
    dto: UpdateProgressDto,
  ) {
    await this.access.assertCanView(courseId, user);

    return this.prisma.quizProgress.upsert({
      where: { userId_courseId: { userId: user.userId, courseId } },
      update: {
        ...(dto.currentIndex !== undefined && {
          currentIndex: dto.currentIndex,
        }),
        ...(dto.isCompleted !== undefined && { isCompleted: dto.isCompleted }),
      },
      create: {
        userId: user.userId,
        courseId,
        currentIndex: dto.currentIndex ?? 0,
        isCompleted: dto.isCompleted ?? false,
      },
    });
  }

  async resetQuizProgress(user: AuthenticatedUser, courseId: string) {
    await this.access.assertCanView(courseId, user);

    return this.prisma.quizProgress.upsert({
      where: { userId_courseId: { userId: user.userId, courseId } },
      update: { currentIndex: 0, isCompleted: false },
      create: {
        userId: user.userId,
        courseId,
        currentIndex: 0,
        isCompleted: false,
      },
    });
  }

  /** Score an answer on the server. A retry replaces the earlier attempt. */
  async create(dto: CreateAttemptDto, user: AuthenticatedUser) {
    const question = await this.prisma.question.findFirst({
      where: { id: dto.questionId, approved: true },
      include: {
        answers: true,
        course: { select: { isPublic: true, createdById: true } },
      },
    });

    if (!question || !this.access.canView(question.course, user)) {
      throw new NotFoundException('Question not found');
    }

    const { isCorrect, correctAnswerIds } = gradeSelection(
      question.answers,
      dto.selectedAnswerIds,
    );

    const existingAttempt = await this.prisma.attempt.findFirst({
      where: { userId: user.userId, questionId: dto.questionId },
    });

    const attempt = existingAttempt
      ? await this.prisma.attempt.update({
          where: { id: existingAttempt.id },
          data: { selectedAnswerIds: dto.selectedAnswerIds, isCorrect },
        })
      : await this.prisma.attempt.create({
          data: {
            userId: user.userId,
            questionId: dto.questionId,
            selectedAnswerIds: dto.selectedAnswerIds,
            isCorrect,
          },
        });

    if (attempt.isCorrect) {
      await this.checkAndMarkCompletion(user.userId, question.courseId);
    }

    return {
      id: attempt.id,
      isCorrect: attempt.isCorrect,
      selectedAnswerIds: attempt.selectedAnswerIds,
      correctAnswerIds,
      hint: question.hint,
      question: { id: question.id, content: question.content },
    };
  }

  async findByUser(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      include: { question: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOverallStats(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      select: { isCorrect: true, question: { select: { courseId: true } } },
    });

    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;

    const byCourse: Record<string, { total: number; correct: number }> = {};
    for (const attempt of attempts) {
      const entry = (byCourse[attempt.question.courseId] ??= {
        total: 0,
        correct: 0,
      });
      entry.total++;
      if (attempt.isCorrect) entry.correct++;
    }

    return {
      overall: {
        total,
        correct,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      },
      byCourse,
    };
  }

  /** The caller's own progress in one course. */
  async getCourseProgress(courseId: string, user: AuthenticatedUser) {
    const course = await this.access.assertCanView(courseId, user);

    const questions = await this.prisma.question.findMany({
      where: { courseId, approved: true },
      select: { id: true },
    });
    const totalQuestions = questions.length;

    const attempts = await this.prisma.attempt.findMany({
      where: {
        userId: user.userId,
        questionId: { in: questions.map((q) => q.id) },
      },
    });

    const answered = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    const percentage =
      totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    return {
      courseId,
      courseName: course.name,
      totalQuestions,
      answered,
      correct,
      remaining: totalQuestions - answered,
      percentage,
      isCompleted: percentage === 100,
    };
  }

  /**
   * Results across every learner, per course the caller manages (every
   * course for admins). This is what instructor analytics should show; the
   * per-user endpoints above only ever describe the caller.
   */
  async getCourseAnalytics(
    user: AuthenticatedUser,
  ): Promise<CourseAnalytics[]> {
    const ownerFilter =
      user.role === Role.ADMIN
        ? Prisma.empty
        : Prisma.sql`WHERE c."createdById" = ${user.userId}`;

    const rows = await this.prisma.$queryRaw<
      Omit<CourseAnalytics, 'accuracy' | 'completionRate'>[]
    >`
      SELECT c.id AS "courseId",
             c.name AS "courseName",
             c."isPublic" AS "isPublic",
             (SELECT count(*)::int FROM "Question" qq
               WHERE qq."courseId" = c.id AND qq.approved) AS "totalQuestions",
             count(DISTINCT a."userId")::int AS "learners",
             count(a.id)::int AS "answered",
             (count(a.id) FILTER (WHERE a."isCorrect"))::int AS "correct",
             (SELECT count(*)::int FROM "QuizProgress" p
               WHERE p."courseId" = c.id AND p."isCompleted") AS "completions"
      FROM "Course" c
      LEFT JOIN "Question" q ON q."courseId" = c.id AND q.approved
      LEFT JOIN "Attempt" a ON a."questionId" = q.id
      ${ownerFilter}
      GROUP BY c.id
      ORDER BY c."createdAt" DESC`;

    return rows.map((row) => ({
      ...row,
      accuracy:
        row.answered > 0 ? Math.round((row.correct / row.answered) * 100) : 0,
      completionRate:
        row.learners > 0
          ? Math.min(100, Math.round((row.completions / row.learners) * 100))
          : 0,
    }));
  }

  /** Marks the quiz complete once every approved question is answered correctly. */
  async checkAndMarkCompletion(userId: string, courseId: string) {
    const questions = await this.prisma.question.findMany({
      where: { courseId, approved: true },
      select: { id: true },
    });
    if (questions.length === 0) return;

    const correctAttempts = await this.prisma.attempt.findMany({
      where: {
        userId,
        questionId: { in: questions.map((q) => q.id) },
        isCorrect: true,
      },
      select: { questionId: true },
    });

    const uniqueCorrect = new Set(correctAttempts.map((a) => a.questionId));
    if (uniqueCorrect.size === questions.length) {
      await this.prisma.quizProgress.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { isCompleted: true },
        create: {
          userId,
          courseId,
          currentIndex: questions.length,
          isCompleted: true,
        },
      });
      this.logger.log(`User ${userId} completed course ${courseId}`);
    }
  }
}
