import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma';
import {
  BulkCreateQuestionDto,
  CreateAnswerDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  UploadQuestionImageDto,
} from './dto';
import { SupabaseStorageService } from '../storage';
import { USER_SUMMARY_SELECT } from '../../common/constants';
import {
  CourseAccessService,
  stripAnswerKey,
  type Viewer,
} from '../../common/access';
import type { AuthenticatedUser } from '../auth/interfaces';

/** Reusable Prisma include for questions with answers and creator. */
const QUESTION_WITH_ANSWERS_AND_CREATOR = {
  answers: true,
  createdBy: { select: USER_SUMMARY_SELECT },
} satisfies Prisma.QuestionInclude;

/** Answers are always created with server-generated ids. */
const toAnswerRows = (answers: CreateAnswerDto[]) =>
  answers.map(({ content, isCorrect }) => ({ content, isCorrect }));

/** The outcome of grading one submission (shape shared with POST /attempts). */
export interface GradedAnswer {
  isCorrect: boolean;
  selectedAnswerIds: string[];
  correctAnswerIds: string[];
  hint: string | null;
  question: { id: string; content: string };
}

/**
 * Grades a selection: correct when it contains exactly the correct options.
 * Throws 400 when an id does not belong to the question.
 */
export function gradeSelection(
  answers: ReadonlyArray<{ id: string; isCorrect: boolean }>,
  selectedAnswerIds: string[],
): { isCorrect: boolean; correctAnswerIds: string[] } {
  const valid = new Set(answers.map((a) => a.id));
  if (
    selectedAnswerIds.length === 0 ||
    selectedAnswerIds.some((id) => !valid.has(id))
  ) {
    throw new BadRequestException(
      'Selected answers do not belong to this question',
    );
  }

  const selected = new Set(selectedAnswerIds);
  const correctAnswerIds = answers.filter((a) => a.isCorrect).map((a) => a.id);
  const isCorrect =
    correctAnswerIds.length === selected.size &&
    correctAnswerIds.every((id) => selected.has(id));

  return { isCorrect, correctAnswerIds };
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
    private readonly storage: SupabaseStorageService,
  ) {}

  /** @throws BadRequestException unless exactly one answer is correct. */
  private validateSingleCorrectAnswer(
    answers: { isCorrect: boolean }[],
    contextMessage = 'Exactly one answer must be marked as correct',
  ): void {
    if (answers.filter((a) => a.isCorrect).length !== 1) {
      throw new BadRequestException(contextMessage);
    }
  }

  /**
   * Loads a question the caller may change: admins, the course owner, and the
   * question's own author.
   */
  private async loadManageableQuestion(
    questionId: string,
    user: Viewer,
    action: string,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { course: { select: { createdById: true } } },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isAuthor = !!user && question.createdById === user.userId;
    if (!isAuthor && !this.access.canManage(question.course, user)) {
      throw new ForbiddenException(`Not authorized to ${action} this question`);
    }

    return question;
  }

  /** Create a question with answers. Manual questions are auto-approved. */
  async create(dto: CreateQuestionDto, user: AuthenticatedUser) {
    await this.access.assertCanManage(dto.courseId, user);
    this.validateSingleCorrectAnswer(dto.answers);

    return this.prisma.question.create({
      data: {
        content: dto.content,
        hint: dto.hint,
        contentType: dto.contentType || 'text',
        imageUrl: dto.imageUrl,
        courseId: dto.courseId,
        createdById: user.userId,
        approved: true,
        aiGenerated: false,
        answers: { create: toAnswerRows(dto.answers) },
      },
      include: QUESTION_WITH_ANSWERS_AND_CREATOR,
    });
  }

  /** Create a question whose prompt is an uploaded image. */
  async createWithImage(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    dto: UploadQuestionImageDto,
    user: AuthenticatedUser,
  ) {
    await this.access.assertCanManage(dto.courseId, user);
    this.validateSingleCorrectAnswer(dto.answers);

    const imageUrl = await this.storage.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      dto.courseId,
    );

    return this.prisma.question.create({
      data: {
        content: dto.content || file.originalname,
        hint: dto.hint,
        contentType: 'image',
        imageUrl,
        courseId: dto.courseId,
        createdById: user.userId,
        approved: true,
        aiGenerated: false,
        answers: { create: toAnswerRows(dto.answers) },
      },
      include: QUESTION_WITH_ANSWERS_AND_CREATOR,
    });
  }

  /**
   * Save several questions at once. The UI uses this for AI drafts the
   * instructor has reviewed, so they are stored approved and marked AI-made.
   * Every target course must belong to the caller.
   */
  async createBulk(dto: BulkCreateQuestionDto, user: AuthenticatedUser) {
    if (dto.questions.length === 0) return [];

    const courseIds = [...new Set(dto.questions.map((q) => q.courseId))];
    for (const courseId of courseIds) {
      await this.access.assertCanManage(courseId, user);
    }

    for (const q of dto.questions) {
      this.validateSingleCorrectAnswer(
        q.answers,
        'Each question must have exactly one answer marked as correct',
      );
    }

    return this.prisma.$transaction(
      dto.questions.map((q) =>
        this.prisma.question.create({
          data: {
            content: q.content,
            hint: q.hint,
            courseId: q.courseId,
            createdById: user.userId,
            approved: true,
            aiGenerated: true,
            answers: { create: toAnswerRows(q.answers) },
          },
          include: { answers: true },
        }),
      ),
    );
  }

  /**
   * Questions of a course. Managers get every question with its answer key;
   * everyone else gets approved questions without `isCorrect`.
   */
  async findByCourse(courseId: string, user?: Viewer) {
    const course = await this.access.assertCanView(courseId, user);
    const canManage = this.access.canManage(course, user);

    const questions = await this.prisma.question.findMany({
      where: { courseId, ...(canManage ? {} : { approved: true }) },
      include: QUESTION_WITH_ANSWERS_AND_CREATOR,
      orderBy: { createdAt: 'desc' },
    });

    return canManage ? questions : questions.map(stripAnswerKey);
  }

  /** Course name and approved questions for share links, without answer keys. */
  async findByCoursePublic(courseId: string, user?: Viewer) {
    const course = await this.access.assertCanView(courseId, user);

    const questions = await this.prisma.question.findMany({
      where: { courseId, approved: true },
      include: { answers: { select: { id: true, content: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
      },
      questions,
    };
  }

  async findOne(id: string, user?: Viewer) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        answers: true,
        course: {
          select: { id: true, name: true, isPublic: true, createdById: true },
        },
      },
    });

    if (!question || !this.access.canView(question.course, user)) {
      throw new NotFoundException('Question not found');
    }

    const result = {
      ...question,
      course: { id: question.course.id, name: question.course.name },
    };

    if (this.access.canManage(question.course, user)) {
      return result;
    }
    if (!question.approved) {
      throw new NotFoundException('Question not found');
    }
    return stripAnswerKey(result);
  }

  /**
   * Grade one answer without recording it. Guests use this instead of
   * receiving the answer key up front; they learn the right option only for
   * the question they just answered.
   */
  async check(
    id: string,
    selectedAnswerIds: string[],
    user?: Viewer,
  ): Promise<GradedAnswer> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        answers: true,
        course: { select: { isPublic: true, createdById: true } },
      },
    });

    if (
      !question ||
      !question.approved ||
      !this.access.canView(question.course, user)
    ) {
      throw new NotFoundException('Question not found');
    }

    const { isCorrect, correctAnswerIds } = gradeSelection(
      question.answers,
      selectedAnswerIds,
    );

    return {
      isCorrect,
      selectedAnswerIds,
      correctAnswerIds,
      hint: question.hint,
      question: { id: question.id, content: question.content },
    };
  }

  /** Edit a question; sending `answers` replaces all of them. */
  async update(id: string, dto: UpdateQuestionDto, user: Viewer) {
    await this.loadManageableQuestion(id, user, 'update');

    if (dto.answers) {
      this.validateSingleCorrectAnswer(dto.answers);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.answers) {
        await tx.answer.deleteMany({ where: { questionId: id } });
        await tx.answer.createMany({
          data: toAnswerRows(dto.answers).map((a) => ({
            ...a,
            questionId: id,
          })),
        });
      }

      return tx.question.update({
        where: { id },
        data: {
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.hint !== undefined && { hint: dto.hint }),
          ...(dto.contentType !== undefined && {
            contentType: dto.contentType,
          }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.approved !== undefined && { approved: dto.approved }),
        },
        include: { answers: true },
      });
    });
  }

  async approve(id: string, user: Viewer) {
    await this.loadManageableQuestion(id, user, 'approve');

    return this.prisma.question.update({
      where: { id },
      data: { approved: true },
      include: { answers: true },
    });
  }

  async remove(id: string, user: Viewer): Promise<{ message: string }> {
    const question = await this.loadManageableQuestion(id, user, 'delete');

    await this.prisma.question.delete({ where: { id } });
    if (question.imageUrl) {
      await this.storage.deleteFile(question.imageUrl);
    }

    return { message: 'Question deleted successfully' };
  }

  /** Unapproved questions in the caller's own courses (every course for admins). */
  async getPendingApproval(user: AuthenticatedUser) {
    return this.prisma.question.findMany({
      where: {
        approved: false,
        ...(user.role === Role.ADMIN
          ? {}
          : { course: { createdById: user.userId } }),
      },
      include: {
        answers: true,
        course: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
