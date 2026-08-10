import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Config } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService<Config>);
  const nodeEnv = configService.get('app.nodeEnv', { infer: true });
  const frontendUrl =
    configService.get('app.frontendUrl', { infer: true }) ||
    'http://localhost:3000';
  const isProduction = nodeEnv === 'production';

  // Behind a TLS-terminating proxy (Render/Fly/Vercel/nginx) Express must trust
  // X-Forwarded-* or it sees every request as http from the proxy's IP. That
  // would break `secure` cookie emission and give the rate limiter a single
  // shared IP for all clients.
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // Baseline security headers (HSTS, nosniff, frame-deny, referrer policy).
  // This is a pure JSON API, so the restrictive CSP default is harmless.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // Required to read the auth JWT and the signed OAuth state cookie.
  app.use(cookieParser(configService.get('app.cookieSecret', { infer: true })));

  // Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 422,
    }),
  );

  // Global interceptors and filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: an explicit allowlist in every environment. `origin: '*'` is
  // incompatible with `credentials: true` (browsers reject the combination),
  // and now that the session rides in a cookie a wildcard would be unsafe
  // rather than merely broken.
  app.enableCors({
    origin: isProduction
      ? [frontendUrl]
      : [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('app.port', { infer: true }) || 3001;

  await app.listen(port);
  logger.log(`🚀 Cognify Backend running on http://localhost:${port}/api`);
}

void bootstrap();
