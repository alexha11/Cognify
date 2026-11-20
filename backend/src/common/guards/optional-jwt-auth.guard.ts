import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates `req.user` when a valid session is present, and lets the request
 * through as anonymous otherwise (no cookie, a bad one, or an expired one).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser {
    return (user || undefined) as TUser;
  }
}
