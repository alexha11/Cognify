import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '../../config';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket = 'materials';

  constructor(private readonly configService: ConfigService<Config>) {
    const url = this.configService.get('app.supabaseUrl', { infer: true });
    const serviceKey = this.configService.get('app.supabaseServiceKey', {
      infer: true,
    });

    if (url && serviceKey) {
      this.client = createClient(url, serviceKey);
      this.logger.log('Supabase storage client initialized');
    } else {
      this.logger.warn(
        'Supabase not configured — file uploads will be stored as data URIs',
      );
    }
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    courseId: string,
  ): Promise<string> {
    if (!this.client) {
      // Fallback: return a placeholder URL when Supabase is not configured
      return `local://${courseId}/${fileName}`;
    }

    const path = `${courseId}/${Date.now()}-${fileName}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, { contentType, upsert: false });

    if (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.client || !fileUrl || fileUrl.startsWith('local://')) return;

    try {
      // Extract path from the public URL
      const bucketPath = fileUrl.split(
        `/storage/v1/object/public/${this.bucket}/`,
      )[1];
      if (!bucketPath) return;

      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([bucketPath]);
      if (error) {
        this.logger.warn(
          `Failed to delete file from storage: ${error.message}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Error deleting file from storage: ${err}`);
    }
  }
}
