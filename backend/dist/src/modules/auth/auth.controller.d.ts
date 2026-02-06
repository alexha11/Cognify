import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, InviteUserDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<any>;
    login(dto: LoginDto): Promise<any>;
    getProfile(user: AuthenticatedUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        organizationId: string;
        organizationName: string;
    }>;
    inviteUser(dto: InviteUserDto, organizationId: string): Promise<any>;
}
