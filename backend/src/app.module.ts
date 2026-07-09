import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { appConfig, appConfigValidationSchema } from './config';

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

    // Database
    PrismaModule,

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
  ],
})
export class AppModule {}
