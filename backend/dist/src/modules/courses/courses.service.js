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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
const organizations_1 = require("../organizations");
const client_1 = require("@prisma/client");
let CoursesService = class CoursesService {
    prisma;
    organizationsService;
    constructor(prisma, organizationsService) {
        this.prisma = prisma;
        this.organizationsService = organizationsService;
    }
    async create(dto, userId, organizationId) {
        const canCreate = await this.organizationsService.checkPlanLimit(organizationId, 'courses');
        if (!canCreate) {
            throw new common_1.ForbiddenException('Course limit reached for your plan. Please upgrade to create more courses.');
        }
        return this.prisma.course.create({
            data: {
                name: dto.name,
                description: dto.description,
                organizationId,
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        materials: true,
                        questions: true,
                    },
                },
            },
        });
    }
    async findAll(organizationId, userRole) {
        const whereClause = {
            organizationId,
            ...(userRole === client_1.Role.STUDENT && { isPublished: true }),
        };
        return this.prisma.course.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        materials: true,
                        questions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, organizationId, userRole) {
        const course = await this.prisma.course.findFirst({
            where: {
                id,
                organizationId,
                ...(userRole === client_1.Role.STUDENT && { isPublished: true }),
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                materials: {
                    orderBy: { createdAt: 'desc' },
                },
                questions: {
                    where: userRole === client_1.Role.STUDENT ? { approved: true } : {},
                    include: {
                        answers: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return course;
    }
    async update(id, dto, userId, organizationId, userRole) {
        const course = await this.prisma.course.findFirst({
            where: { id, organizationId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (userRole !== client_1.Role.ADMIN && course.createdById !== userId) {
            throw new common_1.ForbiddenException('Not authorized to update this course');
        }
        return this.prisma.course.update({
            where: { id },
            data: dto,
            include: {
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
    async remove(id, organizationId) {
        const course = await this.prisma.course.findFirst({
            where: { id, organizationId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        await this.prisma.course.delete({
            where: { id },
        });
        return { message: 'Course deleted successfully' };
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        organizations_1.OrganizationsService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map