import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new question with answers
   */
  async create(
    dto: CreateQuestionDto,
    userId: string,
  ): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
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
   * Create multiple questions in bulk
   */
  async createBulk(
    dto: { questions: CreateQuestionDto[] },
    userId: string,
  ): Promise<any> {
    if (dto.questions.length === 0) return [];
    
    const courseId = dto.questions[0].courseId;
    const course = await this.prisma.course.findFirst({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Validate all questions have exactly one correct answer
    for (const q of dto.questions) {
      const correctAnswers = q.answers.filter((a) => a.isCorrect);
      if (correctAnswers.length !== 1) {
        throw new ForbiddenException(
          'Each question must have exactly one answer marked as correct',
        );
      }
    }

    const createdQuestions = await this.prisma.$transaction(
      dto.questions.map((q) => 
        this.prisma.question.create({
          data: {
            content: q.content,
            hint: q.hint,
            courseId: q.courseId,
            createdById: userId,
            approved: true, // Manual questions are auto-approved
            aiGenerated: true, // They were AI generated, but manually confirmed
            answers: {
              create: q.answers,
            },
          },
          include: {
            answers: true,
          },
        })
      )
    );

    return createdQuestions;
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
    userRole?: Role,
  ) {
    return this.prisma.question.findMany({
      where: {
        courseId,
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
        answers: {
          select: { id: true, content: true, isCorrect: true }, // Need isCorrect for instant frontend feedback
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { course, questions };
  }

  /**
   * Get single question
   */
  async findOne(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id },
      include: {
        answers: true,
        course: {
          select: { id: true, name: true },
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
  ): Promise<any> {
    const question = await this.prisma.question.findFirst({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.$transaction(async (tx) => {
      return tx.question.update({
        where: { id },
        data: {
          content: dto.content,
          hint: dto.hint,
        },
        include: {
          answers: true,
        },
      });
    });
  }

  /**
   * Approve AI question
   */
  async approve(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return this.prisma.question.update({
      where: { id },
      data: { approved: true },
      include: { answers: true },
    });
  }

  /**
   * Delete question
   */
  async remove(
    id: string,
  ): Promise<{ message: string }> {
    const question = await this.prisma.question.findFirst({
      where: { id },
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
   * Get questions pending approval
   */
  async getPendingApproval() {
    return this.prisma.question.findMany({
      where: {
        approved: false,
      },
      include: {
        answers: true,
        course: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
