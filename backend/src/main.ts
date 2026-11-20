import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Config } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  configureApp(app);

  const configService = app.get(ConfigService<Config>);
  if (
    configService.get('app.nodeEnv', { infer: true }) === 'production' &&
    !configService.get('app.trustedProxyHops', { infer: true })
  ) {
    logger.warn(
      'TRUSTED_PROXY_HOPS is not set: rate limits trust the client-supplied X-Forwarded-For header.',
    );
  }

  const port = configService.get('app.port', { infer: true }) || 3001;
  await app.listen(port);
  logger.log(`🚀 Cognify Backend running on http://localhost:${port}/api`);
}

void bootstrap();
