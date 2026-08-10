import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  Profile,
  StrategyOptions,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config';
import { CookieStateStore } from './cookie-state.store';

/** Shape handed to AuthService.validateGoogleUser via `req.user`. */
export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  picture: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService<Config>) {
    const clientID =
      configService.get('app.googleClientId', { infer: true }) || '';
    const clientSecret =
      configService.get('app.googleClientSecret', { infer: true }) || '';
    const frontendUrl =
      configService.get('app.frontendUrl', { infer: true }) ||
      'http://localhost:3000';
    const isProduction =
      configService.get('app.nodeEnv', { infer: true }) === 'production';

    super({
      clientID,
      clientSecret,
      // Must be absolute. A relative callbackURL makes passport reconstruct the
      // origin from the inbound request, which behind a TLS-terminating proxy
      // yields `http://…` and fails Google's exact redirect_uri match.
      //
      // It points at the *frontend* origin on purpose: that route is rewritten
      // to this API by Next.js, so both the state cookie and the session cookie
      // are set on the origin the browser actually talks to. Register this exact
      // URI in the Google Cloud console.
      callbackURL: `${frontendUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
      // Binds the callback to the browser that started the flow (login CSRF).
      // `store` is a passport-oauth2 option whose published typings describe
      // the store's methods as overloads; passport actually dispatches on
      // Function.length, so a fixed-arity implementation cannot satisfy them.
      store: new CookieStateStore(isProduction),
    } as unknown as StrategyOptions);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const primaryEmail = emails?.[0];

    // Google can return a profile without an email if the scope was declined.
    if (!primaryEmail?.value) {
      done(
        new UnauthorizedException('Google account did not provide an email.'),
        false,
      );
      return;
    }

    const user: GoogleProfilePayload = {
      googleId: id,
      email: primaryEmail.value,
      // Passed through to the service, which refuses to link an unverified
      // address to an existing account.
      emailVerified: primaryEmail.verified === true,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
    };

    done(null, user);
  }
}
