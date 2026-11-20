import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, Role } from '@prisma/client';
import { PrismaService } from '../../prisma';
import type { AuthenticatedUser } from '../../modules/auth/interfaces';

/** The caller as far as access rules care; `null`/`undefined` is anonymous. */
export type Viewer =
  | Pick<AuthenticatedUser, 'userId' | 'role'>
  | null
  | undefined;

/**
 * The single source of truth for "who may see or change a course".
 *
 * - Managing (editing the course, its questions and materials, seeing answer
 *   keys and unapproved questions) is limited to the course's creator and
 *   admins. Holding the INSTRUCTOR role is not enough: anyone can sign up as
 *   an instructor.
 * - Viewing a public course is open to everyone. A private course is visible
 *   only to the people who can manage it; everyone else gets a 404, so the
 *   existence of a private course is not revealed.
 */
@Injectable()
export class CourseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  canManage(course: Pick<Course, 'createdById'>, user: Viewer): boolean {
    return (
      !!user && (user.role === Role.ADMIN || course.createdById === user.userId)
    );
  }

  canView(
    course: Pick<Course, 'createdById' | 'isPublic'>,
    user: Viewer,
  ): boolean {
    return course.isPublic || this.canManage(course, user);
  }

  /** Loads the course or throws 404 (missing) / 403 (not the owner). */
  async assertCanManage(courseId: string, user: Viewer): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (!this.canManage(course, user)) {
      throw new ForbiddenException('Not authorized to manage this course');
    }
    return course;
  }

  /** Loads the course or throws 404 when it is missing or private to someone else. */
  async assertCanView(courseId: string, user: Viewer): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || !this.canView(course, user)) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
}
