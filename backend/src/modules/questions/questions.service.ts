import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { OrganizationsService } from '../organizations';
import { Role } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new question with answers
   * Enforces organization plan limits
   */
  async create(
    dto: CreateQuestionDto,
    userId: string,
    organizationId: string,
  ): Promise<any> {
    // Verify course belongs to organization
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, organizationId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check plan limits
    const canCreate = await this.organizationsService.checkPlanLimit(
      organizationId,
      'questions',
    );

    if (!canCreate) {
      throw new ForbiddenException(
        'Question limit reached for your plan. Please upgrade to add more questions.',
      );
    }

    // Ensure exactly one correct answer
    const correctAnswers = dto.answers.filter((a) => a.isCorrect);
    if (correctAnswers.length !== 1) {
      throw new ForbiddenException(
        'Exactly one answer must be marked as correct',
      );
    }

    return this.prisma.question.create({
      data: {
        content: dto.content,
        hint: dto.hint,
        courseId: dto.courseId,
        createdById: userId,
        approved: true, // Manual questions are auto-approved
        aiGenerated: false,
        answers: {
          create: dto.answers,
        },
      },
      include: {
        answers: true,
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
   * Create AI-generated question (unapproved)
   */
  async createAiQuestion(
    content: string,
    hint: string,
    answers: { content: string; isCorrect: boolean }[],
    courseId: string,
    userId: string,
  ) {
    return this.prisma.question.create({
      data: {
        content,
        hint,
        courseId,
        createdById: userId,
        approved: false,
        aiGenerated: true,
        answers: {
          create: answers,
        },
      },
      include: {
        answers: true,
      },
    });
  }

  /**
   * Get questions for a course
   * Students only see approved questions
   */
  async findByCourse(
    courseId: string,
    organizationId?: string,
    userRole?: Role,
  ) {
    return this.prisma.question.findMany({
      where: {
        courseId,
        ...(organizationId && { organizationId }),
        ...(userRole === Role.STUDENT || !userRole ? { approved: true } : {}),
      },
      include: {
        answers: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get questions for a course publicly (no auth required).
   * Returns course name + all approved questions with answers.
   */
  async findByCoursePublic(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, name: true, description: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const questions = await this.prisma.question.findMany({
      where: {
        courseId,
        approved: true,
      },
      include: {
        answers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { course, questions };
  }

  /**
   * Get single question
   */
  async findOne(id: string, organizationId?: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        ...(organizationId && { organizationId }),
      },
      include: {
        answers: true,
        course: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  /**
   * Update question
   */
  async update(
    id: string,
    dto: UpdateQuestionDto,
    organizationId: string,
  ): Promise<any> {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.question.update({
      where: { id },
      data: dto,
      include: {
        answers: true,
      },
    });
  }

  /**
   * Approve an AI-generated question
   */
  async approve(id: string, organizationId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.question.update({
      where: { id },
      data: { approved: true },
      include: {
        answers: true,
      },
    });
  }

  /**
   * Delete question
   */
  async remove(
    id: string,
    organizationId: string,
  ): Promise<{ message: string }> {
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.question.delete({
      where: { id },
    });

    return { message: 'Question deleted successfully' };
  }

  /**
   * Get unapproved AI questions for review
   */
  async getPendingApproval(organizationId: string) {
    return this.prisma.question.findMany({
      where: {
        course: { organizationId },
        aiGenerated: true,
        approved: false,
      },
      include: {
        answers: true,
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
