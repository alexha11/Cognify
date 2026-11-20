import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Config } from './config';

/**
 * Global HTTP behaviour. Shared by `main.ts` and the system tests so tests
 * exercise exactly the pipeline production runs.
 */
export function configureApp(app: NestExpressApplication): void {
  const configService = app.get(ConfigService<Config>);
  const isProduction =
    configService.get('app.nodeEnv', { infer: true }) === 'production';
  const frontendUrl =
    configService.get('app.frontendUrl', { infer: true }) ||
    'http://localhost:3000';

  // Behind a TLS-terminating proxy (Render/Fly/Vercel/nginx) Express must trust
  // X-Forwarded-* or it sees every request as http from the proxy's IP.
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // Baseline security headers (HSTS, nosniff, frame-deny, referrer policy).
  // This is a pure JSON API, so the restrictive CSP default is harmless.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

  // Required to read the auth JWT and the signed OAuth state cookie.
  app.use(cookieParser(configService.get('app.cookieSecret', { infer: true })));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 422,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: an explicit allowlist in every environment. `origin: '*'` is
  // incompatible with `credentials: true`, and with the session in a cookie a
  // wildcard would be unsafe rather than merely broken.
  app.enableCors({
    origin: isProduction
      ? [frontendUrl]
      : [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');
}
