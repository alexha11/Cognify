import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma';
import { appConfig, appConfigValidationSchema } from './config';
import { ThrottlerProxyGuard } from './common/guards';
import { AccessModule } from './common/access';
import { HealthController } from './health/health.controller';

// Feature modules
import { AuthModule } from './modules/auth';
import { CoursesModule } from './modules/courses';
import { QuestionsModule } from './modules/questions';
import { AttemptsModule } from './modules/attempts';
import { MaterialsModule } from './modules/materials';
import { AiModule } from './modules/ai';
import { AccessControlModule } from './modules/access-control';
import { EmbeddingModule } from './modules/embedding';
import { EmailModule } from './modules/email/email.module';
import { LeaderboardModule } from './modules/leaderboard';
import { StorageModule } from './modules/storage';

@Module({
  imports: [
    // Global configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: appConfigValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Baseline abuse protection. Auth endpoints tighten this considerably
    // with their own @Throttle overrides.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),

    // Infrastructure shared by feature modules
    PrismaModule,
    AccessModule,
    StorageModule,

    // Feature modules
    AuthModule,
    CoursesModule,
    QuestionsModule,
    AttemptsModule,
    MaterialsModule,
    AiModule,
    AccessControlModule,
    EmbeddingModule,
    EmailModule,
    LeaderboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Applies rate limiting to every route unless a handler opts out.
    { provide: APP_GUARD, useClass: ThrottlerProxyGuard },
  ],
})
export class AppModule {}
