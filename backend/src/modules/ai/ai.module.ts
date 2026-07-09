import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RagService } from './rag.service';
import { QuestionsModule } from '../questions';

import { EmbeddingModule } from '../embedding';

@Module({
  imports: [QuestionsModule, EmbeddingModule],
  controllers: [AiController],
  providers: [AiService, RagService],
  exports: [AiService, RagService],
})
export class AiModule {}
