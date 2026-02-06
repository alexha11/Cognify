import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { RegisterDto, LoginDto, InviteUserDto, AuthResponseDto } from './dto';
import { Role } from '@prisma/client';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    inviteUser(dto: InviteUserDto, organizationId: string): Promise<{
        message: string;
        userId: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        organizationId: string;
        organizationName: string;
    }>;
    private generateToken;
    private generateSlug;
}
