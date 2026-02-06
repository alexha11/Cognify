import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    create(dto: CreateMaterialDto, user: AuthenticatedUser): Promise<any>;
    findByCourse(courseId: string, user: AuthenticatedUser): Promise<any[]>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        message: string;
    }>;
}
