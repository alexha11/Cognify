import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateLeaderboardEntryDto } from './dto';
import { CourseAccessService, type Viewer } from '../../common/access';
import { LEADERBOARD_TOP_N } from '../../common/constants';

export interface LeaderboardRow {
  id: string;
  displayName: string;
  isGuest: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
  userId: string | null;
}

interface BestEntryRow {
  id: string;
  userId: string | null;
  guestName: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
  firstName: string | null;
  lastName: string | null;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
  ) {}

  /**
   * Each player's best entry (highest percentage, then score, newest on a
   * tie), ranked, top 50. The grouping runs in SQL so the course's whole
   * history is never loaded into memory.
   */
  async getLeaderboard(
    courseId: string,
    user?: Viewer,
  ): Promise<{ courseName: string; entries: LeaderboardRow[] }> {
    const course = await this.access.assertCanView(courseId, user);

    const rows = await this.prisma.$queryRaw<BestEntryRow[]>`
      SELECT best.* FROM (
        SELECT DISTINCT ON (COALESCE(e."userId", 'guest:' || COALESCE(e."guestName", 'Anonymous')))
               e.id, e."userId", e."guestName", e.score, e."totalQuestions",
               e.percentage, e."completedAt", u."firstName", u."lastName"
        FROM "LeaderboardEntry" e
        LEFT JOIN "User" u ON u.id = e."userId"
        WHERE e."courseId" = ${courseId}
        ORDER BY COALESCE(e."userId", 'guest:' || COALESCE(e."guestName", 'Anonymous')),
                 e.percentage DESC, e.score DESC, e."completedAt" DESC
      ) best
      ORDER BY best.percentage DESC, best.score DESC, best."completedAt" ASC
      LIMIT ${LEADERBOARD_TOP_N}`;

    return {
      courseName: course.name,
      entries: rows.map((row) => ({
        id: row.id,
        displayName: row.userId
          ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
          : row.guestName || 'Anonymous',
        isGuest: !row.userId,
        score: row.score,
        totalQuestions: row.totalQuestions,
        percentage: row.percentage,
        completedAt: row.completedAt,
        userId: row.userId,
      })),
    };
  }

  /**
   * Records a finished quiz. Signed-in players are scored from their saved
   * attempts, so the number in the request is ignored. Guests have no server
   * record, so their score is accepted but capped at the real question count.
   */
  async submitEntry(
    dto: CreateLeaderboardEntryDto,
    user?: Viewer,
  ): Promise<LeaderboardRow> {
    await this.access.assertCanView(dto.courseId, user);

    const questions = await this.prisma.question.findMany({
      where: { courseId: dto.courseId, approved: true },
      select: { id: true },
    });
    const totalQuestions = questions.length;
    if (totalQuestions === 0) {
      throw new BadRequestException('This course has no questions yet');
    }

    let score: number;
    if (user) {
      const correct = await this.prisma.attempt.findMany({
        where: {
          userId: user.userId,
          isCorrect: true,
          questionId: { in: questions.map((q) => q.id) },
        },
        distinct: ['questionId'],
        select: { questionId: true },
      });
      score = correct.length;
    } else {
      if (dto.score > totalQuestions) {
        throw new BadRequestException(
          `Score cannot be higher than the number of questions (${totalQuestions})`,
        );
      }
      score = dto.score;
    }

    const entry = await this.prisma.leaderboardEntry.create({
      data: {
        courseId: dto.courseId,
        userId: user?.userId ?? null,
        guestName: user ? null : dto.guestName || 'Anonymous',
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return {
      id: entry.id,
      displayName: entry.user
        ? `${entry.user.firstName} ${entry.user.lastName}`.trim()
        : entry.guestName || 'Anonymous',
      isGuest: !entry.userId,
      score: entry.score,
      totalQuestions: entry.totalQuestions,
      percentage: entry.percentage,
      completedAt: entry.completedAt,
      userId: entry.userId,
    };
  }
}
