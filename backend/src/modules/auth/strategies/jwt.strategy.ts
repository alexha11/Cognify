import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtPayload, AuthenticatedUser } from '../interfaces';
import { Config } from '../../../config';
import { PrismaService } from '../../../prisma';
import { AUTH_COOKIE_NAME } from '../../../common/constants';

/** Reads the JWT from the HttpOnly session cookie. */
const cookieExtractor = (req: Request): string | null => {
  const token = req?.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  return token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService<Config>,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = configService.get('app.jwtSecret', { infer: true });
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      // Cookie first (browsers), Bearer header second (non-browser clients).
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validates the JWT and resolves the *current* user record.
   *
   * The role is deliberately re-read from the database rather than trusted from
   * the token. Tokens live for days, so a token-only check would keep a demoted
   * user privileged — and a deactivated user signed in — until natural expiry.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      this.logger.warn('Rejected JWT with no subject claim');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      this.logger.warn(`Rejected JWT for unknown user ${payload.sub}`);
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
