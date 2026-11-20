import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RagService } from './rag.service';
import { EmbeddingModule } from '../embedding';

@Module({
  imports: [EmbeddingModule],
  controllers: [AiController],
  providers: [AiService, RagService],
  exports: [AiService, RagService],
})
export class AiModule {}
