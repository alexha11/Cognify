import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Used with RolesGuard to enforce role-based access
 *
 * @example
 * @Roles(Role.ADMIN, Role.INSTRUCTOR)
 * @Get('protected-route')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
