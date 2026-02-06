import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(dto: CreateCourseDto, user: AuthenticatedUser): Promise<any>;
    findAll(user: AuthenticatedUser): Promise<any[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<any>;
    update(id: string, dto: UpdateCourseDto, user: AuthenticatedUser): Promise<any>;
    remove(id: string, organizationId: string): Promise<{
        message: string;
    }>;
}
