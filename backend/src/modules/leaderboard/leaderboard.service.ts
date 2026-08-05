import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateLeaderboardEntryDto } from './dto';

interface LeaderboardRow {
  id: string;
  displayName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
  userId: string | null;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the leaderboard for a course (top 50, best score per player)
   */
  async getLeaderboard(courseId: string): Promise<LeaderboardRow[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, name: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { courseId },
      orderBy: [
        { percentage: 'desc' },
        { score: 'desc' },
        { completedAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Group by player (userId or guestName) and keep best score (or newest score on tie)
    const bestByPlayer = new Map<string, (typeof entries)[number]>();

    for (const entry of entries) {
      const key = entry.userId
        ? `user:${entry.userId}`
        : `guest:${entry.guestName || 'Anonymous'}`;
      const existing = bestByPlayer.get(key);
      if (
        !existing ||
        entry.percentage > existing.percentage ||
        (entry.percentage === existing.percentage &&
          entry.score > existing.score) ||
        (entry.percentage === existing.percentage &&
          entry.score === existing.score &&
          entry.completedAt.getTime() > existing.completedAt.getTime())
      ) {
        bestByPlayer.set(key, entry);
      }
    }

    const bestEntries = Array.from(bestByPlayer.values())
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (b.score !== a.score) return b.score - a.score;
        return a.completedAt.getTime() - b.completedAt.getTime();
      })
      .slice(0, 50);

    return bestEntries.map((entry) => ({
      id: entry.id,
      displayName: entry.user
        ? `${entry.user.firstName} ${entry.user.lastName}`
        : entry.guestName || 'Anonymous',
      score: entry.score,
      totalQuestions: entry.totalQuestions,
      percentage: entry.percentage,
      completedAt: entry.completedAt,
      userId: entry.userId,
    }));
  }

  /**
   * Get course name for leaderboard header
   */
  async getCourseName(courseId: string): Promise<string> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { name: true },
    });
    return course?.name || 'Unknown Course';
  }

  /**
   * Submit a leaderboard entry
   */
  async submitEntry(
    dto: CreateLeaderboardEntryDto,
    userId?: string,
  ): Promise<LeaderboardRow> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const percentage =
      dto.totalQuestions > 0
        ? Math.round((dto.score / dto.totalQuestions) * 100)
        : 0;

    let displayName = dto.guestName || 'Anonymous';

    // If logged in, fetch user name
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (user) {
        displayName = `${user.firstName} ${user.lastName}`;
      }
    }

    const entry = await this.prisma.leaderboardEntry.create({
      data: {
        courseId: dto.courseId,
        userId: userId || null,
        guestName: userId ? null : dto.guestName || 'Anonymous',
        score: dto.score,
        totalQuestions: dto.totalQuestions,
        percentage,
      },
    });

    return {
      id: entry.id,
      displayName,
      score: entry.score,
      totalQuestions: entry.totalQuestions,
      percentage: entry.percentage,
      completedAt: entry.completedAt,
      userId: entry.userId,
    };
  }
}
