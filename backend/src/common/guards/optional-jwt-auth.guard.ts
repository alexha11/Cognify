import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 * Extracts user from JWT if present, but doesn't require authentication
 * Returns true even if no token is provided, allowing public access
 * but still populating req.user if a valid token exists
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call super to try to authenticate
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw error if authentication fails
    // Just return undefined user
    return user || undefined;
  }
}
