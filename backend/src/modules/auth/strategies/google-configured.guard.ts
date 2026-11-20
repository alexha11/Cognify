import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config';

/**
 * Lets the API boot without Google credentials outside production (config
 * validation still requires them in production): the Google routes answer
 * 404 instead of sending users to Google with a placeholder client id.
 */
@Injectable()
export class GoogleConfiguredGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Config>) {}

  canActivate(): boolean {
    const id = this.configService.get('app.googleClientId', { infer: true });
    const secret = this.configService.get('app.googleClientSecret', {
      infer: true,
    });
    if (!id || !secret) {
      throw new NotFoundException('Google sign-in is not configured');
    }
    return true;
  }
}
