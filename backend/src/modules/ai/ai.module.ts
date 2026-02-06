import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { QuestionsModule } from '../questions';
import { OrganizationsModule } from '../organizations';

@Module({
  imports: [QuestionsModule, OrganizationsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
