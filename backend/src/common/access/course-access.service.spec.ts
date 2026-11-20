import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CourseAccessService } from './course-access.service';
import { stripAnswerKey } from './answer-key';
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

describe('CourseAccessService', () => {
  let prisma: PrismaMock;
  let access: CourseAccessService;

  beforeEach(() => {
    prisma = createPrismaMock();
    access = new CourseAccessService(asPrisma(prisma));
  });

  describe('canManage', () => {
    it.each([
      ['the owner', owner, true],
      ['an admin', admin, true],
      ['another instructor', otherInstructor, false],
      ['a student', student, false],
      ['an anonymous visitor', undefined, false],
    ])('%s → %s', (_label, user, expected) => {
      expect(access.canManage(publicCourse, user)).toBe(expected);
    });
  });

  describe('canView', () => {
    it('shows public courses to everyone', () => {
      expect(access.canView(publicCourse, undefined)).toBe(true);
      expect(access.canView(publicCourse, student)).toBe(true);
    });

    it('shows private courses only to their owner and admins', () => {
      expect(access.canView(privateCourse, owner)).toBe(true);
      expect(access.canView(privateCourse, admin)).toBe(true);
      expect(access.canView(privateCourse, otherInstructor)).toBe(false);
      expect(access.canView(privateCourse, student)).toBe(false);
      expect(access.canView(privateCourse, null)).toBe(false);
    });
  });

  describe('assertCanManage', () => {
    it('returns the course for its owner', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await expect(
        access.assertCanManage('course-public', owner),
      ).resolves.toBe(publicCourse);
    });

    it('answers 403 to other instructors and 404 for missing courses', async () => {
      prisma.course.findUnique.mockResolvedValueOnce(publicCourse);
      await expect(
        access.assertCanManage('course-public', otherInstructor),
      ).rejects.toThrow(ForbiddenException);

      prisma.course.findUnique.mockResolvedValueOnce(null);
      await expect(access.assertCanManage('missing', owner)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertCanView', () => {
    it('hides private courses behind a 404, not a 403', async () => {
      prisma.course.findUnique.mockResolvedValue(privateCourse);
      await expect(
        access.assertCanView('course-private', student),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

describe('stripAnswerKey', () => {
  it('removes isCorrect but keeps the options and the rest of the question', () => {
    const question = {
      id: 'q1',
      content: 'Pick one',
      answers: [
        { id: 'a1', content: 'Right', isCorrect: true, questionId: 'q1' },
        { id: 'a2', content: 'Wrong', isCorrect: false, questionId: 'q1' },
      ],
    };

    const stripped = stripAnswerKey(question);

    expect(stripped).toEqual({
      id: 'q1',
      content: 'Pick one',
      answers: [
        { id: 'a1', content: 'Right' },
        { id: 'a2', content: 'Wrong' },
      ],
    });
    expect(JSON.stringify(stripped)).not.toContain('isCorrect');
  });
});
