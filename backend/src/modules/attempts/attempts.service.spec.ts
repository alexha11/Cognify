import { NotFoundException } from '@nestjs/common';
import { CourseAccessService } from '../../common/access';
import { AttemptsService } from './attempts.service';
import {
  asPrisma,
  createPrismaMock,
  owner,
  PrismaMock,
  privateCourse,
  publicCourse,
  student,
} from '../../testing/prisma.mock';

describe('AttemptsService', () => {
  let prisma: PrismaMock;
  let service: AttemptsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AttemptsService(
      asPrisma(prisma),
      new CourseAccessService(asPrisma(prisma)),
    );
  });

  describe('getQuizProgress', () => {
    it('returns a default position without writing anything', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      prisma.quizProgress.findUnique.mockResolvedValue(null);

      const progress = await service.getQuizProgress(student, publicCourse.id);

      expect(progress).toMatchObject({ currentIndex: 0, isCompleted: false });
      expect(prisma.quizProgress.create).not.toHaveBeenCalled();
      expect(prisma.quizProgress.upsert).not.toHaveBeenCalled();
    });

    it('answers 404 for unknown or private courses instead of a database error', async () => {
      prisma.course.findUnique.mockResolvedValueOnce(null);
      await expect(service.getQuizProgress(student, 'missing')).rejects.toThrow(
        NotFoundException,
      );

      prisma.course.findUnique.mockResolvedValueOnce(privateCourse);
      await expect(
        service.getQuizProgress(student, privateCourse.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const question = {
      id: 'q1',
      content: 'Pick',
      hint: 'Hint',
      courseId: publicCourse.id,
      approved: true,
      answers: [
        { id: 'a1', isCorrect: true },
        { id: 'a2', isCorrect: false },
      ],
      course: { isPublic: true, createdById: owner.userId },
    };

    it('scores on the server and returns the correct ids', async () => {
      prisma.question.findFirst.mockResolvedValue(question);
      prisma.attempt.findFirst.mockResolvedValue(null);
      prisma.attempt.create.mockImplementation(({ data }) => ({
        id: 'att-1',
        ...data,
      }));

      const result = await service.create(
        { questionId: 'q1', selectedAnswerIds: ['a2'] },
        student,
      );

      expect(result).toMatchObject({
        isCorrect: false,
        correctAnswerIds: ['a1'],
      });
    });

    it('refuses questions in private courses the learner cannot see', async () => {
      prisma.question.findFirst.mockResolvedValue({
        ...question,
        course: { isPublic: false, createdById: owner.userId },
      });
      await expect(
        service.create(
          { questionId: 'q1', selectedAnswerIds: ['a1'] },
          student,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCourseAnalytics', () => {
    it('derives accuracy and completion rate from the aggregate row', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          courseId: 'c1',
          courseName: 'C1',
          isPublic: true,
          totalQuestions: 4,
          learners: 4,
          answered: 10,
          correct: 7,
          completions: 1,
        },
      ]);

      const [row] = await service.getCourseAnalytics(owner);

      expect(row).toMatchObject({ accuracy: 70, completionRate: 25 });
    });
  });
});
