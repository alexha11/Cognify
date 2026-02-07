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
  async create(
    dto: CreateCourseDto,
    userId: string,
    organizationId: string,
  ) {
    console.log('[CoursesService] Creating course:', { dto, userId, organizationId });
    
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
    console.log('[CoursesService] Course created successfully:', { id: course.id, name: course.name });
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
  async findOne(id: string, organizationId?: string, userRole?: Role) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        ...(organizationId && { organizationId }),
        ...(userRole === Role.STUDENT || !userRole ? { isPublished: true } : {}),
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
          where: (userRole === Role.STUDENT || !userRole) ? { approved: true } : {},
          include: {
            answers: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
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
   * Delete course
   * Only admin can delete
   */
  async remove(id: string, organizationId: string): Promise<{ message: string }> {
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
