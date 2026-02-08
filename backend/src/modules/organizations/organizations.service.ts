import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all public organizations (for discovery)
   * No authentication required
   */
  async findAllPublic(): Promise<any[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { isPublic: true },
      include: {
        _count: {
          select: {
            courses: { where: { isPublic: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      courseCount: org._count.courses,
      createdAt: org.createdAt,
    }));
  }

  /**
   * Get organization by slug (for public discovery)
   * Returns org with its public courses
   */
  async findBySlug(slug: string, userId?: string, userOrgId?: string): Promise<any> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
        courses: {
          where: {
            OR: [
              { isPublic: true },
              ...(userOrgId === undefined ? [] : [{ organizationId: userOrgId }]),
              ...(userId === undefined ? [] : [{ createdById: userId }]),
            ],
          },
          include: {
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user can access this org (public or member)
    const canAccess = organization.isPublic || userOrgId === organization.id;
    if (!canAccess) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logoUrl: organization.logoUrl,
      isPublic: organization.isPublic,
      plan: organization.plan,
      createdAt: organization.createdAt,
      userCount: organization._count.users,
      courseCount: organization._count.courses,
      courses: organization.courses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        isPublic: course.isPublic,
        questionCount: course._count.questions,
        createdAt: course.createdAt,
      })),
    };
  }

  /**
   * Get current organization details
   * Organization ID is derived from JWT, never from request
   */
  async findOne(organizationId: string): Promise<any> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logoUrl: organization.logoUrl,
      isPublic: organization.isPublic,
      plan: organization.plan,
      createdAt: organization.createdAt,
      userCount: organization._count.users,
      courseCount: organization._count.courses,
    };
  }

  /**
   * Get all users in organization
   */
  async getUsers(organizationId: string): Promise<any[]> {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update organization
   */
  async update(
    organizationId: string,
    data: { name?: string; description?: string; logoUrl?: string },
  ): Promise<any> {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  /**
   * Toggle organization visibility (public/private)
   * Only admins can change visibility
   */
  async updateVisibility(
    organizationId: string,
    isPublic: boolean,
  ): Promise<any> {
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { isPublic },
    });

    return {
      id: updated.id,
      name: updated.name,
      isPublic: updated.isPublic,
    };
  }

  /**
   * Get plan limits based on organization plan
   */
  getPlanLimits(plan: string): { maxCourses: number; maxQuestions: number; maxUsers: number } {
    const limits = {
      FREE: { maxCourses: 5, maxQuestions: 200, maxUsers: 10 },
      PRO: { maxCourses: 25, maxQuestions: 1000, maxUsers: 100 },
      ENTERPRISE: { maxCourses: -1, maxQuestions: -1, maxUsers: -1 },
    };

    return limits[plan as keyof typeof limits] || limits.FREE;
  }

  /**
   * Check if organization has reached plan limit
   */
  async checkPlanLimit(
    organizationId: string,
    limitType: 'courses' | 'questions' | 'users',
  ): Promise<boolean> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!org) return false;

    const limits = this.getPlanLimits(org.plan);
    
    if (limitType === 'courses') {
      return limits.maxCourses === -1 || org._count.courses < limits.maxCourses;
    }
    if (limitType === 'users') {
      return limits.maxUsers === -1 || org._count.users < limits.maxUsers;
    }

    if (limitType === 'questions') {
      const questionCount = await this.prisma.question.count({
        where: {
          course: { organizationId },
        },
      });
      return limits.maxQuestions === -1 || questionCount < limits.maxQuestions;
    }

    return true;
  }

  /**
   * Alias for findOne (backwards compatibility)
   */
  async getMyOrganization(organizationId: string): Promise<any> {
    return this.findOne(organizationId);
  }
}
