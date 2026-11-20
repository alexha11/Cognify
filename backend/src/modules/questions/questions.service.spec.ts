import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CourseAccessService } from '../../common/access';
import { SupabaseStorageService } from '../storage';
import { QuestionsService, gradeSelection } from './questions.service';
import {
  admin,
  asPrisma,
  createPrismaMock,
  otherInstructor,
  owner,
  PrismaMock,
  privateCourse,
  publicCourse,
  student,
} from '../../testing/prisma.mock';

const answers = [
  { id: 'a1', content: 'Right', isCorrect: true, questionId: 'q1' },
  { id: 'a2', content: 'Wrong', isCorrect: false, questionId: 'q1' },
];
const question = (overrides = {}) => ({
  id: 'q1',
  content: 'Pick one',
  hint: 'Think',
  approved: true,
  courseId: publicCourse.id,
  createdById: owner.userId,
  answers,
  course: { isPublic: true, createdById: owner.userId },
  ...overrides,
});
const newQuestion = {
  content: 'New?',
  courseId: publicCourse.id,
  answers: [
    { content: 'Yes', isCorrect: true },
    { content: 'No', isCorrect: false },
  ],
};

describe('gradeSelection', () => {
  it('is correct only for exactly the correct options', () => {
    expect(gradeSelection(answers, ['a1'])).toEqual({
      isCorrect: true,
      correctAnswerIds: ['a1'],
    });
    expect(gradeSelection(answers, ['a2']).isCorrect).toBe(false);
    expect(gradeSelection(answers, ['a1', 'a2']).isCorrect).toBe(false);
  });

  it('rejects ids that belong to another question', () => {
    expect(() => gradeSelection(answers, ['a1', 'other'])).toThrow(
      BadRequestException,
    );
    expect(() => gradeSelection(answers, [])).toThrow(BadRequestException);
  });
});

describe('QuestionsService', () => {
  let prisma: PrismaMock;
  let storage: { uploadFile: jest.Mock; deleteFile: jest.Mock };
  let service: QuestionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    storage = {
      uploadFile: jest.fn().mockResolvedValue('https://files/x.png'),
      deleteFile: jest.fn(),
    };
    service = new QuestionsService(
      asPrisma(prisma),
      new CourseAccessService(asPrisma(prisma)),
      storage as unknown as SupabaseStorageService,
    );
  });

  describe('create', () => {
    it("refuses to write into another instructor's course", async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await expect(
        service.create(newQuestion, otherInstructor),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.question.create).not.toHaveBeenCalled();
    });

    it('lets the owner create an approved question with fresh answer ids', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await service.create(
        {
          ...newQuestion,
          answers: [
            { id: 'client-chosen', content: 'Yes', isCorrect: true },
            { content: 'No', isCorrect: false },
          ],
        },
        owner,
      );

      const { data } = prisma.question.create.mock.calls[0][0];
      expect(data.approved).toBe(true);
      expect(data.answers.create).toEqual([
        { content: 'Yes', isCorrect: true },
        { content: 'No', isCorrect: false },
      ]);
    });

    it('requires exactly one correct answer', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await expect(
        service.create(
          {
            ...newQuestion,
            answers: [
              { content: 'Yes', isCorrect: true },
              { content: 'Also yes', isCorrect: true },
            ],
          },
          owner,
        ),
      ).rejects.toThrow('Exactly one answer');
    });
  });

  describe('createBulk', () => {
    it('checks ownership of every target course, not just the first', async () => {
      prisma.course.findUnique
        .mockResolvedValueOnce(publicCourse)
        .mockResolvedValueOnce({
          ...privateCourse,
          createdById: 'someone-else',
        });

      await expect(
        service.createBulk(
          {
            questions: [
              newQuestion,
              { ...newQuestion, courseId: 'course-of-someone-else' },
            ],
          },
          owner,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findByCourse', () => {
    it('gives learners approved questions without the answer key', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      prisma.question.findMany.mockResolvedValue([question()]);

      const result = await service.findByCourse(publicCourse.id, student);

      expect(prisma.question.findMany.mock.calls[0][0].where).toEqual({
        courseId: publicCourse.id,
        approved: true,
      });
      expect(JSON.stringify(result)).not.toContain('isCorrect');
    });

    it('gives the owner every question, including unapproved ones, with the key', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      prisma.question.findMany.mockResolvedValue([
        question({ approved: false }),
      ]);

      const result = await service.findByCourse(publicCourse.id, owner);

      expect(prisma.question.findMany.mock.calls[0][0].where).toEqual({
        courseId: publicCourse.id,
      });
      expect(result[0].answers[0]).toHaveProperty('isCorrect', true);
    });

    it('hides private courses from anonymous visitors', async () => {
      prisma.course.findUnique.mockResolvedValue(privateCourse);
      await expect(
        service.findByCourse(privateCourse.id, undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('check (guest grading)', () => {
    it('grades one answer and reveals the key only for that question', async () => {
      prisma.question.findUnique.mockResolvedValue(question());

      const result = await service.check('q1', ['a2'], undefined);

      expect(result).toMatchObject({
        isCorrect: false,
        correctAnswerIds: ['a1'],
        hint: 'Think',
        question: { id: 'q1', content: 'Pick one' },
      });
    });

    it('does not grade unapproved questions or private courses for outsiders', async () => {
      prisma.question.findUnique.mockResolvedValueOnce(
        question({ approved: false }),
      );
      await expect(service.check('q1', ['a1'])).rejects.toThrow(
        NotFoundException,
      );

      prisma.question.findUnique.mockResolvedValueOnce(
        question({ course: { isPublic: false, createdById: owner.userId } }),
      );
      await expect(service.check('q1', ['a1'], student)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPendingApproval', () => {
    it("limits instructors to their own courses' questions", async () => {
      prisma.question.findMany.mockResolvedValue([]);
      await service.getPendingApproval(owner);
      expect(prisma.question.findMany.mock.calls[0][0].where).toEqual({
        approved: false,
        course: { createdById: owner.userId },
      });
    });

    it('shows admins everything', async () => {
      prisma.question.findMany.mockResolvedValue([]);
      await service.getPendingApproval(admin);
      expect(prisma.question.findMany.mock.calls[0][0].where).toEqual({
        approved: false,
      });
    });
  });
});
