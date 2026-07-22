import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { SupabaseStorageService } from '../materials/supabase-storage.service';


@Module({

  controllers: [QuestionsController],
  providers: [QuestionsService, SupabaseStorageService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
