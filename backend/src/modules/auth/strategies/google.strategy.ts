import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService<Config>) {
    const clientID = configService.get('app.googleClientId', { infer: true }) || '';
    const clientSecret = configService.get('app.googleClientSecret', { infer: true }) || '';

    super({
      clientID,
      clientSecret,
      callbackURL: '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
    };
    done(null, user);
  }
}
