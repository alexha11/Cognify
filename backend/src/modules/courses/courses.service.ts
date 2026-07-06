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
    // Use organizationId from dto if provided (admin creating for a specific org),
    // otherwise fall back to the caller's org.
    const resolvedOrgId = dto.organizationId || organizationId;

    // Check plan limits
    const canCreate = await this.organizationsService.checkPlanLimit(
      resolvedOrgId,
      'courses',
    );

    if (!canCreate) {
      throw new ForbiddenException(
        'Course limit reached for your plan. Please upgrade to create more courses.',
      );
    }

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        organizationId: resolvedOrgId,
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
   * Get all courses for organization
   * Also includes public courses from orgs the user has joined as a member
   * Students only see published courses
   */
  async findAll(organizationId?: string, userRole?: Role, userId?: string) {
    const publishedFilter =
      userRole === Role.STUDENT || !userRole ? { isPublished: true } : {};

    // Get orgs the user is a member of (if userId provided)
    let memberOrgIds: string[] = [];
    if (userId) {
      const memberships = await this.prisma.orgMembership.findMany({
        where: { userId },
        select: { organizationId: true },
      });
      memberOrgIds = memberships.map((m) => m.organizationId);
    }

    let whereClause: any;

    if (organizationId) {
      // User belongs to an org — show their org's courses + public courses from joined orgs
      whereClause = {
        ...publishedFilter,
        OR: [
          { organizationId },
          ...(memberOrgIds.length > 0
            ? [{ organizationId: { in: memberOrgIds }, isPublic: true }]
            : []),
        ],
      };
    } else {
      // Standalone user — show public courses, their own, and joined org public courses
      whereClause = {
        ...publishedFilter,
        OR: [
          { isPublic: true },
          ...(userId ? [{ createdById: userId }] : []),
          ...(memberOrgIds.length > 0
            ? [{ organizationId: { in: memberOrgIds }, isPublic: true }]
            : []),
        ],
      };
    }

    return this.prisma.course.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
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
    organizationId: string,
    userRole: Role,
  ) {
    const course = await this.prisma.course.findFirst({
      where: { 
        id, 
        ...(organizationId && { organizationId }) 
      },
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
      where: { 
        id, 
        ...(organizationId && { organizationId }) 
      },
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
   * NOTE: CoursePrerequisite model is not yet in the schema, so this
   * always returns true until the feature is implemented.
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
      where: { 
        id: courseId, 
        ...(organizationId && { organizationId }) 
      },
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
      where: { 
        id, 
        ...(organizationId && { organizationId }) 
      },
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
