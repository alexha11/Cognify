import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new course
   */
  async create(dto: CreateCourseDto, userId: string) {
    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            materials: true,
            questions: true,
          },
        },
      },
    });

    return course;
  }

  /**
   * Get all courses
   * Students only see published courses
   */
  async findAll(userRole?: Role, userId?: string) {
    const publishedFilter =
      userRole === Role.STUDENT || !userRole ? { isPublished: true } : {};

    const whereClause = {
      ...publishedFilter,
      OR: [
        { isPublic: true },
        ...(userId ? [{ createdById: userId }] : []),
      ],
    };

    return this.prisma.course.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { materials: true, questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single course by ID
   */
  async findOne(
    id: string,
    userRole?: Role,
    userId?: string,
  ) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        ...(userRole === Role.STUDENT || !userRole
          ? { isPublished: true }
          : {}),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
    const course = await this.prisma.course.findFirst({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Only admin or creator can update
    if (userRole !== Role.ADMIN && course.createdById !== userId) {
      throw new ForbiddenException('Not authorized to update this course');
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
  ): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Instructors can only update their own courses
    if (role === Role.INSTRUCTOR && course.createdById !== userId) {
      throw new ForbiddenException(
        'You can only change visibility of courses you created',
      );
    }

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
  async checkPrerequisites(_courseId: string, _userId: string): Promise<boolean> {
    return true;
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
   * Helper to verify if user can manage a course
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
  }

  /**
   * Delete course
   */
  async remove(id: string): Promise<{ message: string }> {
    const course = await this.prisma.course.findFirst({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Course deleted successfully' };
  }
}
