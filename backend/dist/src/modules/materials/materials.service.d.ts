import { PrismaService } from '../../prisma';
import { CreateMaterialDto } from './dto';
export declare class MaterialsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateMaterialDto, userId: string, organizationId: string): Promise<any>;
    findByCourse(courseId: string, organizationId: string): Promise<any[]>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
}
