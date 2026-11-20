import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CourseAccessService } from '../../common/access';
import { SupabaseStorageService } from '../storage';
import { CoursesService } from './courses.service';
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

const courseWithContent = (course = publicCourse) => ({
  ...course,
  createdBy: { id: owner.userId, firstName: 'O', lastName: 'Wner' },
  materials: [],
  prerequisites: [],
  questions: [
    {
      id: 'q-approved',
      approved: true,
      answers: [{ id: 'a1', content: 'A', isCorrect: true }],
    },
    {
      id: 'q-draft',
      approved: false,
      answers: [{ id: 'a2', content: 'B', isCorrect: true }],
    },
  ],
});

describe('CoursesService', () => {
  let prisma: PrismaMock;
  let storage: { deleteFile: jest.Mock };
  let service: CoursesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    storage = { deleteFile: jest.fn() };
    service = new CoursesService(
      asPrisma(prisma),
      new CourseAccessService(asPrisma(prisma)),
      storage as unknown as SupabaseStorageService,
    );
  });

  describe('findAll', () => {
    it.each([
      ['anonymous visitors', undefined, { isPublic: true }],
      ['students', student, { isPublic: true }],
      [
        'instructors',
        owner,
        { OR: [{ isPublic: true }, { createdById: owner.userId }] },
      ],
      ['admins', admin, {}],
    ])('scopes the list for %s', async (_label, user, where) => {
      prisma.course.findMany.mockResolvedValue([]);
      await service.findAll(user);
      expect(prisma.course.findMany.mock.calls[0][0].where).toEqual(where);
    });
  });

  describe('findOne', () => {
    it('strips answer keys and drafts for learners', async () => {
      prisma.course.findUnique.mockResolvedValue(courseWithContent());

      const course = await service.findOne(publicCourse.id, student);

      expect(course.questions.map((q) => q.id)).toEqual(['q-approved']);
      expect(JSON.stringify(course.questions)).not.toContain('isCorrect');
      expect(course.canManage).toBe(false);
    });

    it('gives the owner everything', async () => {
      prisma.course.findUnique.mockResolvedValue(courseWithContent());

      const course = await service.findOne(publicCourse.id, owner);

      expect(course.questions).toHaveLength(2);
      expect(course.canManage).toBe(true);
    });

    it('hides private courses from other instructors', async () => {
      prisma.course.findUnique.mockResolvedValue(
        courseWithContent(privateCourse),
      );
      await expect(
        service.findOne(privateCourse.id, otherInstructor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('prerequisites', () => {
    it('refuses changes from someone who does not own the course', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await expect(
        service.addPrerequisite(publicCourse.id, 'other', otherInstructor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses a course as its own prerequisite', async () => {
      prisma.course.findUnique.mockResolvedValue(publicCourse);
      await expect(
        service.addPrerequisite(publicCourse.id, publicCourse.id, owner),
      ).rejects.toThrow('itself');
    });

    it('refuses links that would close a loop', async () => {
      // B already requires A (indirectly via C); adding "A requires B" loops.
      prisma.course.findUnique.mockImplementation(({ where }) => ({
        ...publicCourse,
        id: where.id,
      }));
      prisma.coursePrerequisite.findMany.mockImplementation(({ where }) => {
        const from = where.courseId.in as string[];
        if (from.includes('B')) return [{ requiresCourseId: 'C' }];
        if (from.includes('C')) return [{ requiresCourseId: 'A' }];
        return [];
      });

      await expect(service.addPrerequisite('A', 'B', owner)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.coursePrerequisite.upsert).not.toHaveBeenCalled();
    });

    it('computes prerequisitesMet from completed quizzes', async () => {
      prisma.quizProgress.count.mockResolvedValue(1);
      await expect(
        service.prerequisitesMet(['p1', 'p2'], student.userId),
      ).resolves.toBe(false);
      await expect(service.prerequisitesMet([], undefined)).resolves.toBe(true);
      await expect(service.prerequisitesMet(['p1'], undefined)).resolves.toBe(
        false,
      );
    });
  });

  describe('remove', () => {
    it('deletes stored files after the course is gone', async () => {
      prisma.course.findUnique.mockResolvedValue({
        ...publicCourse,
        createdById: owner.userId,
      });
      prisma.material.findMany.mockResolvedValue([
        { fileUrl: 'https://store/m.pdf' },
      ]);
      prisma.question.findMany.mockResolvedValue([
        { imageUrl: 'https://store/q.png' },
      ]);

      await service.remove(publicCourse.id, {
        ...owner,
        role: Role.INSTRUCTOR,
      });

      expect(prisma.course.delete).toHaveBeenCalled();
      expect(storage.deleteFile).toHaveBeenCalledWith('https://store/m.pdf');
      expect(storage.deleteFile).toHaveBeenCalledWith('https://store/q.png');
    });
  });
});
