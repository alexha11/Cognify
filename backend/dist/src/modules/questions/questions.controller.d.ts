import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    create(dto: CreateQuestionDto, user: AuthenticatedUser): Promise<any>;
    findByCourse(courseId: string, user: AuthenticatedUser): Promise<any[]>;
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
    update(id: string, dto: UpdateQuestionDto, user: AuthenticatedUser): Promise<any>;
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
    remove(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
