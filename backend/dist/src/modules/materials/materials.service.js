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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
let MaterialsService = class MaterialsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId, organizationId) {
        const course = await this.prisma.course.findFirst({
            where: { id: dto.courseId, organizationId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return this.prisma.material.create({
            data: {
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                fileType: dto.fileType,
                fileSize: dto.fileSize,
                courseId: dto.courseId,
                uploadedById: userId,
            },
        });
    }
    async findByCourse(courseId, organizationId) {
        return this.prisma.material.findMany({
            where: {
                courseId,
                course: { organizationId },
            },
            include: {
                uploadedBy: {
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
    async remove(id, organizationId) {
        const material = await this.prisma.material.findFirst({
            where: {
                id,
                course: { organizationId },
            },
        });
        if (!material) {
            throw new common_1.NotFoundException('Material not found');
        }
        await this.prisma.material.delete({
            where: { id },
        });
        return { message: 'Material deleted successfully' };
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map