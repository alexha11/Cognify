import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Update organization name
   */
  async update(
    organizationId: string,
    data: { name?: string },
  ): Promise<any> {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  /**
   * Get plan limits based on organization plan
   */
  getPlanLimits(plan: string): { maxCourses: number; maxQuestions: number; maxUsers: number } {
    const limits = {
      FREE: { maxCourses: 1, maxQuestions: 50, maxUsers: 5 },
      PRO: { maxCourses: 10, maxQuestions: 500, maxUsers: 50 },
      ENTERPRISE: { maxCourses: -1, maxQuestions: -1, maxUsers: -1 }, // unlimited
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

    // For questions, we need to count across all courses
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
