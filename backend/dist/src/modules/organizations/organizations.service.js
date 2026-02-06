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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(organizationId) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: {
                        users: true,
                        courses: true,
                    },
                },
            },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan,
            createdAt: organization.createdAt,
            userCount: organization._count.users,
            courseCount: organization._count.courses,
        };
    }
    async getUsers(organizationId) {
        return this.prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(organizationId, data) {
        return this.prisma.organization.update({
            where: { id: organizationId },
            data,
        });
    }
    getPlanLimits(plan) {
        const limits = {
            FREE: { maxCourses: 1, maxQuestions: 50, maxUsers: 5 },
            PRO: { maxCourses: 10, maxQuestions: 500, maxUsers: 50 },
            ENTERPRISE: { maxCourses: -1, maxQuestions: -1, maxUsers: -1 },
        };
        return limits[plan] || limits.FREE;
    }
    async checkPlanLimit(organizationId, limitType) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                _count: {
                    select: {
                        users: true,
                        courses: true,
                    },
                },
            },
        });
        if (!org)
            return false;
        const limits = this.getPlanLimits(org.plan);
        if (limitType === 'courses') {
            return limits.maxCourses === -1 || org._count.courses < limits.maxCourses;
        }
        if (limitType === 'users') {
            return limits.maxUsers === -1 || org._count.users < limits.maxUsers;
        }
        if (limitType === 'questions') {
            const questionCount = await this.prisma.question.count({
                where: {
                    course: { organizationId },
                },
            });
            return limits.maxQuestions === -1 || questionCount < limits.maxQuestions;
        }
        return true;
    }
    async getMyOrganization(organizationId) {
        return this.findOne(organizationId);
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map