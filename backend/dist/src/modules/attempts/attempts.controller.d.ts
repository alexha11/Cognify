import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
export declare class AttemptsController {
    private readonly attemptsService;
    constructor(attemptsService: AttemptsService);
    create(dto: CreateAttemptDto, user: AuthenticatedUser): Promise<any>;
    findMyAttempts(user: AuthenticatedUser): Promise<any[]>;
    getStats(user: AuthenticatedUser): Promise<any>;
    getCourseProgress(courseId: string, user: AuthenticatedUser): Promise<any>;
}
