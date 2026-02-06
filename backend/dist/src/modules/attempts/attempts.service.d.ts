import { PrismaService } from '../../prisma';
import { CreateAttemptDto } from './dto';
export declare class AttemptsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateAttemptDto, userId: string, organizationId: string): Promise<{
        id: string;
        isCorrect: boolean;
        selectedAnswer: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        };
        correctAnswer: {
            id: string;
            content: string;
            isCorrect: boolean;
            questionId: string;
        } | undefined;
        hint: string | null;
        question: {
            id: string;
            content: string;
        };
    }>;
    findByUser(userId: string): Promise<any[]>;
    getOverallStats(userId: string, organizationId: string): Promise<any>;
    getCourseProgress(courseId: string, userId: string, organizationId: string): Promise<{
        courseId: string;
        courseName: string;
        totalQuestions: number;
        answered: number;
        correct: number;
        remaining: number;
        percentage: number;
    }>;
}
