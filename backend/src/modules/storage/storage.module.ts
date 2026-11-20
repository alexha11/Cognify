import { Global, Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

/** One storage client for the whole app (it used to be instantiated per module). */
@Global()
@Module({
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class StorageModule {}
