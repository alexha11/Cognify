import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  organizationId: string;
  role: Role;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}
