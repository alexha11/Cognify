import { PrismaService } from '../../prisma';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { OrganizationsService } from '../organizations';
import { Role } from '@prisma/client';
export declare class CoursesService {
    private readonly prisma;
    private readonly organizationsService;
    constructor(prisma: PrismaService, organizationsService: OrganizationsService);
    create(dto: CreateCourseDto, userId: string, organizationId: string): Promise<{
        _count: {
            questions: number;
            materials: number;
        };
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        name: string;
        description: string | null;
        isPublished: boolean;
        createdById: string;
    }>;
    findAll(organizationId: string, userRole: Role): Promise<({
        _count: {
            questions: number;
            materials: number;
        };
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        name: string;
        description: string | null;
        isPublished: boolean;
        createdById: string;
    })[]>;
    findOne(id: string, organizationId: string, userRole: Role): Promise<{
        questions: ({
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
        })[];
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
        materials: {
            id: string;
            createdAt: Date;
            courseId: string;
            fileName: string;
            fileUrl: string;
            fileType: string;
            fileSize: number;
            uploadedById: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        name: string;
        description: string | null;
        isPublished: boolean;
        createdById: string;
    }>;
    update(id: string, dto: UpdateCourseDto, userId: string, organizationId: string, userRole: Role): Promise<{
        createdBy: {
            firstName: string;
            lastName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        name: string;
        description: string | null;
        isPublished: boolean;
        createdById: string;
    }>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
}
