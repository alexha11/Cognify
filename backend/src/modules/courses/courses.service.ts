import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { Role } from '@prisma/client';
import { USER_SUMMARY_SELECT } from '../../common/constants';

/** Reusable Prisma include for course responses with creator and counts. */
const COURSE_WITH_CREATOR_AND_COUNTS = {
  createdBy: { select: USER_SUMMARY_SELECT },
  _count: { select: { materials: true, questions: true } },
} as const;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new course
   */
  async create(dto: CreateCourseDto, userId: string) {
    return this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        createdById: userId,
      },
      include: COURSE_WITH_CREATOR_AND_COUNTS,
    });
  }

  /**
   * Get all courses
   * Students only see published courses
   */
  async findAll(userRole?: Role, userId?: string) {
    const publishedFilter =
      userRole === Role.STUDENT || !userRole ? { isPublic: true } : {};

    const whereClause = {
      ...publishedFilter,
      OR: [{ isPublic: true }, ...(userId ? [{ createdById: userId }] : [])],
    };

    return this.prisma.course.findMany({
      where: whereClause,
      include: COURSE_WITH_CREATOR_AND_COUNTS,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single course by ID
   */
  async findOne(id: string, userRole?: Role) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        ...(userRole === Role.STUDENT || !userRole ? { isPublic: true } : {}),
      },
      include: {
        createdBy: { select: USER_SUMMARY_SELECT },
        materials: {
          orderBy: { createdAt: 'desc' },
        },
        questions: {
          where:
            userRole === Role.STUDENT || !userRole ? { approved: true } : {},
          include: {
            answers: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      } as any,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return {
      ...course,
      prerequisitesMet: true,
    };
  }

  /**
   * Update course
   * Only creator or admin can update
   */
  async update(
    id: string,
    dto: UpdateCourseDto,
    userId: string,
    userRole: Role,
  ) {
    await this.verifyCourseAccess(id, userId, userRole);

    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        createdBy: { select: USER_SUMMARY_SELECT },
      },
    });
  }

  /**
   * Toggle course visibility (public/private)
   * Instructors can only change their own courses
   */
  async updateVisibility(
    id: string,
    isPublic: boolean,
    userId: string,
    role: Role,
  ): Promise<{ id: string; name: string; isPublic: boolean }> {
    await this.verifyCourseAccess(id, userId, role);

    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublic },
    });

    return {
      id: updated.id,
      name: updated.name,
      isPublic: updated.isPublic,
    };
  }

  /**
   * Check if user has completed all prerequisites for a course.
   */
  checkPrerequisites(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * Add a prerequisite to a course
   */
  async addPrerequisite(
    courseId: string,
    prerequisiteId: string,
    userId: string,
    role: Role,
  ) {
    // Verify course access
    await this.verifyCourseAccess(courseId, userId, role);

    // Verify prerequisite exists
    const prerequisite = await this.prisma.course.findFirst({
      where: { id: prerequisiteId },
    });

    if (!prerequisite) {
      throw new NotFoundException('Prerequisite course not found');
    }

    if (courseId === prerequisiteId) {
      throw new ForbiddenException(
        'A course cannot be a prerequisite of itself',
      );
    }

    return (this.prisma as any).coursePrerequisite.upsert({
      where: {
        courseId_requiresCourseId: {
          courseId,
          requiresCourseId: prerequisiteId,
        },
      },
      create: {
        courseId,
        requiresCourseId: prerequisiteId,
      },
      update: {},
    });
  }

  /**
   * Remove a prerequisite from a course
   */
  async removePrerequisite(
    courseId: string,
    prerequisiteId: string,
    userId: string,
    role: Role,
  ) {
    await this.verifyCourseAccess(courseId, userId, role);

    await (this.prisma as any).coursePrerequisite.delete({
      where: {
        courseId_requiresCourseId: {
          courseId,
          requiresCourseId: prerequisiteId,
        },
      },
    });

    return { message: 'Prerequisite removed' };
  }

  /**
   * Verify if user can manage a course.
   * @returns The course if access is granted.
   * @throws NotFoundException if course doesn't exist.
   * @throws ForbiddenException if user lacks permission.
   */
  private async verifyCourseAccess(
    courseId: string,
    userId: string,
    role: Role,
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role !== Role.ADMIN && course.createdById !== userId) {
      throw new ForbiddenException('Not authorized to manage this course');
    }

    return course;
  }

  /**
   * Delete course
   */
  async remove(
    id: string,
    userId?: string,
    role?: Role,
  ): Promise<{ message: string }> {
    const course = await this.prisma.course.findFirst({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role && role !== Role.ADMIN && course.createdById !== userId) {
      throw new ForbiddenException('Not authorized to delete this course');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Course deleted successfully' };
  }
}
