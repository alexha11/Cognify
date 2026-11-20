import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { USER_SUMMARY_SELECT } from '../../common/constants';
import {
  CourseAccessService,
  stripAnswerKey,
  type Viewer,
} from '../../common/access';
import { SupabaseStorageService } from '../storage';

/** Reusable Prisma include for course responses with creator and counts. */
const COURSE_WITH_CREATOR_AND_COUNTS = {
  createdBy: { select: USER_SUMMARY_SELECT },
  _count: { select: { materials: true, questions: true } },
} satisfies Prisma.CourseInclude;

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
    private readonly storage: SupabaseStorageService,
  ) {}

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
   * Courses the caller may see: public ones for everyone, plus their own for
   * instructors, and every course for admins.
   */
  async findAll(user?: Viewer) {
    let where: Prisma.CourseWhereInput = { isPublic: true };
    if (user?.role === Role.ADMIN) {
      where = {};
    } else if (user?.role === Role.INSTRUCTOR) {
      where = { OR: [{ isPublic: true }, { createdById: user.userId }] };
    }

    return this.prisma.course.findMany({
      where,
      include: COURSE_WITH_CREATOR_AND_COUNTS,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * One course with its materials and questions. People who can manage the
   * course get every question with its answer key; everyone else gets
   * approved questions without `isCorrect`.
   */
  async findOne(id: string, user?: Viewer) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        createdBy: { select: USER_SUMMARY_SELECT },
        materials: { orderBy: { createdAt: 'desc' } },
        questions: {
          include: { answers: true },
          orderBy: { createdAt: 'desc' },
        },
        prerequisites: {
          include: { requiresCourse: { select: { id: true, name: true } } },
        },
      },
    });

    if (!course || !this.access.canView(course, user)) {
      throw new NotFoundException('Course not found');
    }

    const canManage = this.access.canManage(course, user);
    const prerequisites = course.prerequisites.map((p) => p.requiresCourse);

    return {
      ...course,
      questions: canManage
        ? course.questions
        : course.questions.filter((q) => q.approved).map(stripAnswerKey),
      prerequisites,
      canManage,
      prerequisitesMet: await this.prerequisitesMet(
        prerequisites.map((p) => p.id),
        user?.userId,
      ),
    };
  }

  async update(id: string, dto: UpdateCourseDto, user: Viewer) {
    await this.access.assertCanManage(id, user);

    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: COURSE_WITH_CREATOR_AND_COUNTS,
    });
  }

  async updateVisibility(
    id: string,
    isPublic: boolean,
    user: Viewer,
  ): Promise<{ id: string; name: string; isPublic: boolean }> {
    await this.access.assertCanManage(id, user);

    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublic },
    });

    return { id: updated.id, name: updated.name, isPublic: updated.isPublic };
  }

  /**
   * Deletes the course (the database cascades to everything under it) and
   * then removes its stored files, which the cascade cannot reach.
   */
  async remove(id: string, user: Viewer): Promise<{ message: string }> {
    await this.access.assertCanManage(id, user);

    const [materials, images] = await Promise.all([
      this.prisma.material.findMany({
        where: { courseId: id },
        select: { fileUrl: true },
      }),
      this.prisma.question.findMany({
        where: { courseId: id, imageUrl: { not: null } },
        select: { imageUrl: true },
      }),
    ]);

    await this.prisma.course.delete({ where: { id } });

    const urls = [
      ...materials.map((m) => m.fileUrl),
      ...images.map((q) => q.imageUrl as string),
    ];
    for (const url of urls) {
      await this.storage.deleteFile(url);
    }
    if (urls.length > 0) {
      this.logger.log(`Removed ${urls.length} stored file(s) for course ${id}`);
    }

    return { message: 'Course deleted successfully' };
  }

  /** True when the learner has completed every course in `requiredIds`. */
  async prerequisitesMet(
    requiredIds: string[],
    userId?: string,
  ): Promise<boolean> {
    if (requiredIds.length === 0) return true;
    if (!userId) return false;

    const completed = await this.prisma.quizProgress.count({
      where: { userId, courseId: { in: requiredIds }, isCompleted: true },
    });
    return completed === requiredIds.length;
  }

  async addPrerequisite(
    courseId: string,
    prerequisiteId: string,
    user: Viewer,
  ) {
    await this.access.assertCanManage(courseId, user);

    if (courseId === prerequisiteId) {
      throw new BadRequestException(
        'A course cannot be a prerequisite of itself',
      );
    }

    // The required course must be one the owner can actually see.
    await this.access.assertCanView(prerequisiteId, user);

    if (await this.createsCycle(courseId, prerequisiteId)) {
      throw new BadRequestException(
        'This would create a circular chain of prerequisites',
      );
    }

    return this.prisma.coursePrerequisite.upsert({
      where: {
        courseId_requiresCourseId: {
          courseId,
          requiresCourseId: prerequisiteId,
        },
      },
      create: { courseId, requiresCourseId: prerequisiteId },
      update: {},
    });
  }

  async removePrerequisite(
    courseId: string,
    prerequisiteId: string,
    user: Viewer,
  ): Promise<{ message: string }> {
    await this.access.assertCanManage(courseId, user);

    const { count } = await this.prisma.coursePrerequisite.deleteMany({
      where: { courseId, requiresCourseId: prerequisiteId },
    });
    if (count === 0) {
      throw new NotFoundException('Prerequisite not found');
    }

    return { message: 'Prerequisite removed' };
  }

  /**
   * Adding "courseId requires prerequisiteId" closes a loop if courseId is
   * already reachable from prerequisiteId by following "requires" edges.
   */
  private async createsCycle(
    courseId: string,
    prerequisiteId: string,
  ): Promise<boolean> {
    const seen = new Set<string>();
    let frontier = [prerequisiteId];

    while (frontier.length > 0) {
      if (frontier.includes(courseId)) return true;
      frontier.forEach((id) => seen.add(id));

      const edges = await this.prisma.coursePrerequisite.findMany({
        where: { courseId: { in: frontier } },
        select: { requiresCourseId: true },
      });
      frontier = [...new Set(edges.map((e) => e.requiresCourseId))].filter(
        (id) => !seen.has(id),
      );
    }

    return false;
  }
}
