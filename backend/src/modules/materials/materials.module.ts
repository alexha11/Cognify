import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { EmbeddingModule } from '../embedding';

@Module({
  imports: [EmbeddingModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, SupabaseStorageService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
