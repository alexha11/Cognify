import { Role } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class InviteUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: Role;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        organizationId: string;
        organizationName: string;
    };
}
