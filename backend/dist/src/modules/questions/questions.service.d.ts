import { PrismaService } from '../../prisma';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { OrganizationsService } from '../organizations';
import { Role } from '@prisma/client';
export declare class QuestionsService {
    private readonly prisma;
    private readonly organizationsService;
    constructor(prisma: PrismaService, organizationsService: OrganizationsService);
    create(dto: CreateQuestionDto, userId: string, organizationId: string): Promise<any>;
    createAiQuestion(content: string, hint: string, answers: {
        content: string;
        isCorrect: boolean;
    }[], courseId: string, userId: string): Promise<{
        answers: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        approved: boolean;
        content: string;
        hint: string | null;
        aiGenerated: boolean;
        courseId: string;
    }>;
    findByCourse(courseId: string, organizationId: string, userRole: Role): Promise<any[]>;
    findOne(id: string, organizationId: string): Promise<{
        course: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            name: string;
            description: string | null;
            isPublished: boolean;
            createdById: string;
        };
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
        answers: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        approved: boolean;
        content: string;
        hint: string | null;
        aiGenerated: boolean;
        courseId: string;
    }>;
    update(id: string, dto: UpdateQuestionDto, organizationId: string): Promise<any>;
    approve(id: string, organizationId: string): Promise<{
        answers: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        approved: boolean;
        content: string;
        hint: string | null;
        aiGenerated: boolean;
        courseId: string;
    }>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
    getPendingApproval(organizationId: string): Promise<({
        course: {
            id: string;
            name: string;
        };
        answers: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string;
        approved: boolean;
        content: string;
        hint: string | null;
        aiGenerated: boolean;
        courseId: string;
    })[]>;
}
