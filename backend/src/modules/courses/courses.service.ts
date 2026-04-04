import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { OrganizationsService } from '../organizations';
import { Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new course
   * Enforces organization plan limits
   */
  async create(dto: CreateCourseDto, userId: string, organizationId: string) {
    console.log('[CoursesService] Creating course:', {
      dto,
      userId,
      organizationId,
    });

    // Check plan limits
    const canCreate = await this.organizationsService.checkPlanLimit(
      organizationId,
      'courses',
    );
    console.log('[CoursesService] Plan limit check:', { canCreate });

    if (!canCreate) {
      throw new ForbiddenException(
        'Course limit reached for your plan. Please upgrade to create more courses.',
      );
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId,
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
    console.log('[CoursesService] Course created successfully:', {
      id: course.id,
      name: course.name,
    });
    return course;
  }

  /**
   * Get all courses for organization
   * Students only see published courses
   */
  async findAll(organizationId?: string, userRole?: Role) {
    const whereClause = {
      ...(organizationId && { organizationId }),
      ...(userRole === Role.STUDENT || !userRole ? { isPublished: true } : {}),
    };

    return this.prisma.course.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single course by ID
   * Enforces organization isolation
   */
  async findOne(
    id: string,
    organizationId?: string,
    userRole?: Role,
    userId?: string,
  ) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        ...(organizationId && { organizationId }),
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
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      } as any,
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Role-based access control for Student
    if (userRole === Role.STUDENT && userId) {
      const prerequisitesMet = await this.checkPrerequisites(id, userId);

      if (!prerequisitesMet) {
        // Hide materials and correct answers if prerequisites not met
        return {
          ...course,
          materials: [], // Restricted
          questions: (course as any).questions.map((q: any) => ({
            ...q,
            hint: 'Prerequisites not met', // Optional: hide hint too?
            answers: q.answers.map((a: any) => ({
              ...a,
              isCorrect: undefined, // Hide correctness
            })),
          })),
          prerequisitesMet: false,
        };
      }
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
    organizationId: string,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId },
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
   * Admins can change any course in their organization
   */
  async updateVisibility(
    id: string,
    isPublic: boolean,
    userId: string,
    organizationId: string,
    role: Role,
  ): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId },
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
   * Check if user has completed all prerequisites for a course
   */
  async checkPrerequisites(courseId: string, userId: string): Promise<boolean> {
    const prerequisites = await (
      this.prisma as any
    ).coursePrerequisite.findMany({
      where: { courseId },
      select: { requiresCourseId: true },
    });

    if (prerequisites.length === 0) return true;

    const completions = await (this.prisma as any).courseCompletion.findMany({
      where: {
        userId,
        courseId: { in: prerequisites.map((p: any) => p.requiresCourseId) },
      },
    });

    return completions.length === prerequisites.length;
  }

  /**
   * Add a prerequisite to a course
   */
  async addPrerequisite(
    courseId: string,
    prerequisiteId: string,
    organizationId: string,
    userId: string,
    role: Role,
  ) {
    // Verify course access
    await this.verifyCourseAccess(courseId, organizationId, userId, role);

    // Verify prerequisite exists
    const prerequisite = await this.prisma.course.findFirst({
      where: { id: prerequisiteId, organizationId },
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
    organizationId: string,
    userId: string,
    role: Role,
  ) {
    await this.verifyCourseAccess(courseId, organizationId, userId, role);

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
    organizationId: string,
    userId: string,
    role: Role,
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, organizationId },
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
   * Only admin can delete
   */
  async remove(
    id: string,
    organizationId: string,
  ): Promise<{ message: string }> {
    const course = await this.prisma.course.findFirst({
      where: { id, organizationId },
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
