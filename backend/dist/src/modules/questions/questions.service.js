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
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
const organizations_1 = require("../organizations");
const client_1 = require("@prisma/client");
let QuestionsService = class QuestionsService {
    prisma;
    organizationsService;
    constructor(prisma, organizationsService) {
        this.prisma = prisma;
        this.organizationsService = organizationsService;
    }
    async create(dto, userId, organizationId) {
        const course = await this.prisma.course.findFirst({
            where: { id: dto.courseId, organizationId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const canCreate = await this.organizationsService.checkPlanLimit(organizationId, 'questions');
        if (!canCreate) {
            throw new common_1.ForbiddenException('Question limit reached for your plan. Please upgrade to add more questions.');
        }
        const correctAnswers = dto.answers.filter((a) => a.isCorrect);
        if (correctAnswers.length !== 1) {
            throw new common_1.ForbiddenException('Exactly one answer must be marked as correct');
        }
        return this.prisma.question.create({
            data: {
                content: dto.content,
                hint: dto.hint,
                courseId: dto.courseId,
                createdById: userId,
                approved: true,
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
    async createAiQuestion(content, hint, answers, courseId, userId) {
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
    async findByCourse(courseId, organizationId, userRole) {
        const course = await this.prisma.course.findFirst({
            where: { id: courseId, organizationId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return this.prisma.question.findMany({
            where: {
                courseId,
                ...(userRole === client_1.Role.STUDENT && { approved: true }),
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
    async findOne(id, organizationId) {
        const question = await this.prisma.question.findFirst({
            where: {
                id,
                course: { organizationId },
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
            throw new common_1.NotFoundException('Question not found');
        }
        return question;
    }
    async update(id, dto, organizationId) {
        const question = await this.prisma.question.findFirst({
            where: {
                id,
                course: { organizationId },
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return this.prisma.question.update({
            where: { id },
            data: dto,
            include: {
                answers: true,
            },
        });
    }
    async approve(id, organizationId) {
        const question = await this.prisma.question.findFirst({
            where: {
                id,
                course: { organizationId },
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return this.prisma.question.update({
            where: { id },
            data: { approved: true },
            include: {
                answers: true,
            },
        });
    }
    async remove(id, organizationId) {
        const question = await this.prisma.question.findFirst({
            where: {
                id,
                course: { organizationId },
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        await this.prisma.question.delete({
            where: { id },
        });
        return { message: 'Question deleted successfully' };
    }
    async getPendingApproval(organizationId) {
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
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        organizations_1.OrganizationsService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map