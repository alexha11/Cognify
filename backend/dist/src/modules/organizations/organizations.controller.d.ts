import { OrganizationsService } from './organizations.service';
import type { AuthenticatedUser } from '../auth/interfaces';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    getMyOrganization(user: AuthenticatedUser): Promise<any>;
    getUsers(organizationId: string): Promise<any[]>;
    update(organizationId: string, dto: UpdateOrganizationDto): Promise<any>;
    getPlanLimits(organizationId: string): Promise<{
        maxCourses: number;
        maxQuestions: number;
        maxUsers: number;
    }>;
}
