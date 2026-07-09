import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces';
import { Config } from '../../../config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService<Config>) {
    const jwtSecret = configService.get('app.jwtSecret', { infer: true });
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validates the JWT payload and returns the authenticated user.
   * This data is attached to the request object as req.user
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.role) {
      console.error('Invalid JWT Payload detected:', payload);
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,

      role: payload.role,
    };
  }
}
