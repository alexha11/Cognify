"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
let AttemptsService = class AttemptsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId, organizationId) {
        const question = await this.prisma.question.findFirst({
            where: {
                id: dto.questionId,
                approved: true,
                course: { organizationId },
            },
            include: {
                answers: true,
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        const answer = question.answers.find((a) => a.id === dto.selectedAnswerId);
        if (!answer) {
            throw new common_1.ForbiddenException('Invalid answer for this question');
        }
        const existingAttempt = await this.prisma.attempt.findFirst({
            where: {
                userId,
                questionId: dto.questionId,
            },
        });
        if (existingAttempt) {
            throw new common_1.ForbiddenException('You have already answered this question');
        }
        const attempt = await this.prisma.attempt.create({
            data: {
                userId,
                questionId: dto.questionId,
                selectedAnswerId: dto.selectedAnswerId,
                isCorrect: answer.isCorrect,
            },
            include: {
                question: {
                    include: {
                        answers: true,
                    },
                },
                selectedAnswer: true,
            },
        });
        return {
            id: attempt.id,
            isCorrect: attempt.isCorrect,
            selectedAnswer: attempt.selectedAnswer,
            correctAnswer: question.answers.find((a) => a.isCorrect),
            hint: question.hint,
            question: {
                id: question.id,
                content: question.content,
            },
        };
    }
    async findByUser(userId) {
        return this.prisma.attempt.findMany({
            where: { userId },
            include: {
                question: true,
                selectedAnswer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOverallStats(userId, organizationId) {
        const attempts = await this.prisma.attempt.findMany({
            where: {
                userId,
                question: {
                    course: { organizationId },
                },
            },
            select: {
                isCorrect: true,
                question: {
                    select: {
                        courseId: true,
                    },
                },
            },
        });
        const total = attempts.length;
        const correct = attempts.filter((a) => a.isCorrect).length;
        const byCourse = attempts.reduce((acc, attempt) => {
            const courseId = attempt.question.courseId;
            if (!acc[courseId]) {
                acc[courseId] = { total: 0, correct: 0 };
            }
            acc[courseId].total++;
            if (attempt.isCorrect) {
                acc[courseId].correct++;
            }
            return acc;
        }, {});
        return {
            overall: {
                total,
                correct,
                percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
            },
            byCourse,
        };
    }
    async getCourseProgress(courseId, userId, organizationId) {
        const course = await this.prisma.course.findFirst({
            where: { id: courseId, organizationId },
            include: {
                questions: {
                    where: { approved: true },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const totalQuestions = course.questions.length;
        const attempts = await this.prisma.attempt.findMany({
            where: {
                userId,
                questionId: { in: course.questions.map((q) => q.id) },
            },
        });
        const answered = attempts.length;
        const correct = attempts.filter((a) => a.isCorrect).length;
        return {
            courseId,
            courseName: course.name,
            totalQuestions,
            answered,
            correct,
            remaining: totalQuestions - answered,
            percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
        };
    }
};
exports.AttemptsService = AttemptsService;
exports.AttemptsService = AttemptsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], AttemptsService);
//# sourceMappingURL=attempts.service.js.map