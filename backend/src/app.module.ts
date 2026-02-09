import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { appConfig, appConfigValidationSchema } from './config';

// Feature modules
import { AuthModule } from './modules/auth';
import { OrganizationsModule } from './modules/organizations';
import { CoursesModule } from './modules/courses';
import { QuestionsModule } from './modules/questions';
import { AttemptsModule } from './modules/attempts';
import { MaterialsModule } from './modules/materials';
import { AiModule } from './modules/ai';
import { BillingModule } from './modules/billing';
import { AccessControlModule } from './modules/access-control';

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
    OrganizationsModule,
    CoursesModule,
    QuestionsModule,
    AttemptsModule,
    MaterialsModule,
    AiModule,
    BillingModule,
    AccessControlModule,
  ],
})
export class AppModule {}
