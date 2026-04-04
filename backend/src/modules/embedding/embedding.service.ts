import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

type PipelineFunction = (...args: unknown[]) => Promise<{ data: Float32Array }>;

@Injectable()
export class EmbeddingService implements OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingService.name);
  private pipelineFn: PipelineFunction | null = null;
  private initPromise: Promise<void> | null = null;

  private async initialize(): Promise<void> {
    if (this.pipelineFn) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      this.logger.log('Loading embedding model (all-MiniLM-L6-v2)...');
      const { pipeline } = await import('@huggingface/transformers');
      this.pipelineFn = (await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      )) as unknown as PipelineFunction;
      this.logger.log('Embedding model loaded successfully');
    })();

    await this.initPromise;
  }

  async embedText(text: string): Promise<number[]> {
    await this.initialize();
    const output = await this.pipelineFn!(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    await this.initialize();

    const batchSize = 32;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => this.embedText(text)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  onModuleDestroy(): void {
    this.pipelineFn = null;
    this.initPromise = null;
  }
}
