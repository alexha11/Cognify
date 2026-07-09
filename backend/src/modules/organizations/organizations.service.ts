import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new organization
   * Assigns the creator as the owner (INSTRUCTOR/ADMIN)
   */
  async create(
    userId: string,
    data: { name: string; description?: string; logoUrl?: string; isPublic?: boolean },
  ): Promise<any> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ForbiddenException('Organization name already taken');
    }

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          logoUrl: data.logoUrl,
          isPublic: data.isPublic ?? true, // Respect user choice, default to true if not provided
        },
      });

      await tx.orgMembership.create({
        data: { userId, organizationId: org.id },
      });

      return org;
    });
  }

  /**
   * Get all public organizations (for discovery)
   */
  async findAllPublic(): Promise<any[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { isPublic: true },
      include: {
        _count: {
          select: {
            courses: { where: { isPublic: true } },
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      courseCount: org._count.courses,
      memberCount: org._count.members,
      createdAt: org.createdAt,
    }));
  }

  /**
   * Get organization by slug
   * Returns isMember flag for the requesting user
   */
  async findBySlug(
    slug: string,
    userId?: string,
    userOrgId?: string,
  ): Promise<any> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            courses: true,
            members: true,
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
            _count: { select: { questions: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        members: userId
          ? { where: { userId }, select: { id: true } }
          : false,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const canAccess = organization.isPublic || userOrgId === organization.id;
    if (!canAccess) {
      throw new NotFoundException('Organization not found');
    }

    const isMember =
      Array.isArray(organization.members) && organization.members.length > 0;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      logoUrl: organization.logoUrl,
      isPublic: organization.isPublic,
      plan: organization.plan,
      createdAt: organization.createdAt,
      courseCount: organization._count.courses,
      memberCount: organization._count.members,
      isMember,
      courses: organization.courses.map((course: any) => ({
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
   */
  async findOne(organizationId: string): Promise<any> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { members: true, courses: true },
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
      memberCount: organization._count.members,
      courseCount: organization._count.courses,
    };
  }

  /**
   * Join an organization (create a membership)
   */
  async joinOrganization(
    userId: string,
    organizationId: string,
  ): Promise<any> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    if (!org.isPublic) {
      throw new ForbiddenException('This organization is private');
    }

    try {
      const membership = await this.prisma.orgMembership.create({
        data: { userId, organizationId },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      return { message: 'Joined organization successfully', membership };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          'You are already a member of this organization',
        );
      }
      throw e;
    }
  }

  /**
   * Leave an organization (remove membership)
   */
  async leaveOrganization(
    userId: string,
    organizationId: string,
  ): Promise<{ message: string }> {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) {
      throw new NotFoundException('You are not a member of this organization');
    }

    await this.prisma.orgMembership.delete({
      where: { userId_organizationId: { userId, organizationId } },
    });

    return { message: 'Left organization successfully' };
  }

  /**
   * Get all organizations the user has joined (memberships)
   */
  async getUserMemberships(userId: string): Promise<any[]> {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            courses: {
              where: { isPublic: true },
              include: {
                _count: { select: { questions: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                courses: { where: { isPublic: true } },
                members: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      joinedAt: m.joinedAt,
      organization: {
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        description: m.organization.description,
        logoUrl: m.organization.logoUrl,
        courseCount: m.organization._count.courses,
        memberCount: m.organization._count.members,
        courses: m.organization.courses.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          isPublic: c.isPublic,
          questionCount: c._count.questions,
          createdAt: c.createdAt,
        })),
      },
    }));
  }

  /**
   * Get all users in organization
   */
  async getUsers(organizationId: string): Promise<any[]> {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map(m => m.user);
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
   */
  async updateVisibility(
    organizationId: string,
    isPublic: boolean,
  ): Promise<any> {
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { isPublic },
    });

    return { id: updated.id, name: updated.name, isPublic: updated.isPublic };
  }

  /**
   * Get plan limits based on organization plan
   */
  getPlanLimits(plan: string): {
    maxCourses: number;
    maxQuestions: number;
    maxUsers: number;
  } {
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
    if (!organizationId) return true;

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: { select: { members: true, courses: true } },
      },
    });

    if (!org) return false;

    const limits = this.getPlanLimits(org.plan);

    if (limitType === 'courses') {
      return limits.maxCourses === -1 || org._count.courses < limits.maxCourses;
    }
    if (limitType === 'users') {
      return limits.maxUsers === -1 || org._count.members < limits.maxUsers;
    }
    if (limitType === 'questions') {
      const questionCount = await this.prisma.question.count({
        where: { course: { organizationId } },
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
