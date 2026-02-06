import { PrismaService } from '../../prisma';
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOne(organizationId: string): Promise<any>;
    getUsers(organizationId: string): Promise<any[]>;
    update(organizationId: string, data: {
        name?: string;
    }): Promise<any>;
    getPlanLimits(plan: string): {
        maxCourses: number;
        maxQuestions: number;
        maxUsers: number;
    };
    checkPlanLimit(organizationId: string, limitType: 'courses' | 'questions' | 'users'): Promise<boolean>;
    getMyOrganization(organizationId: string): Promise<any>;
}
