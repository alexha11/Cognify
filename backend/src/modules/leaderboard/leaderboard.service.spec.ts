import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseAccessService } from '../../common/access';
import { LeaderboardService } from './leaderboard.service';
import {
  asPrisma,
  createPrismaMock,
  PrismaMock,
  privateCourse,
  publicCourse,
  student,
} from '../../testing/prisma.mock';

describe('LeaderboardService.submitEntry', () => {
  let prisma: PrismaMock;
  let service: LeaderboardService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new LeaderboardService(
      asPrisma(prisma),
      new CourseAccessService(asPrisma(prisma)),
    );
    prisma.course.findUnique.mockResolvedValue(publicCourse);
    prisma.question.findMany.mockResolvedValue([
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q3' },
      { id: 'q4' },
    ]);
    prisma.leaderboardEntry.create.mockImplementation(({ data }) => ({
      id: 'entry-1',
      completedAt: new Date(),
      user: data.userId ? { firstName: 'Sara', lastName: 'Student' } : null,
      ...data,
    }));
  });

  it('scores signed-in players from their attempts and ignores the submitted score', async () => {
    prisma.attempt.findMany.mockResolvedValue([
      { questionId: 'q1' },
      { questionId: 'q3' },
    ]);

    const entry = await service.submitEntry(
      { courseId: publicCourse.id, score: 999, totalQuestions: 1 },
      student,
    );

    expect(entry).toMatchObject({
      score: 2,
      totalQuestions: 4,
      percentage: 50,
      isGuest: false,
      displayName: 'Sara Student',
    });
  });

  it('rejects guest scores above the real question count', async () => {
    await expect(
      service.submitEntry(
        { courseId: publicCourse.id, score: 999999, totalQuestions: 1 },
        undefined,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.leaderboardEntry.create).not.toHaveBeenCalled();
  });

  it('records guests against the real question count and marks them as guests', async () => {
    const entry = await service.submitEntry(
      { courseId: publicCourse.id, score: 3, guestName: 'Visitor' },
      undefined,
    );
    expect(entry).toMatchObject({
      score: 3,
      totalQuestions: 4,
      percentage: 75,
      isGuest: true,
      displayName: 'Visitor',
    });
  });

  it('refuses courses without questions and private courses', async () => {
    prisma.question.findMany.mockResolvedValueOnce([]);
    await expect(
      service.submitEntry({ courseId: publicCourse.id, score: 0 }, undefined),
    ).rejects.toThrow('no questions');

    prisma.course.findUnique.mockResolvedValueOnce(privateCourse);
    await expect(
      service.submitEntry({ courseId: privateCourse.id, score: 0 }, student),
    ).rejects.toThrow(NotFoundException);
  });
});
