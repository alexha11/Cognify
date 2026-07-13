import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Config } from '../../config';

@Injectable()
export class EmbeddingService implements OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/embeddings';
  private readonly model = 'openai/text-embedding-3-small';
  private readonly dimensions = 512;

  constructor(private readonly configService: ConfigService<Config>) {}

  private getApiKey(): string {
    const key = this.configService.get('app.openRouterApiKey', { infer: true });
    if (!key) {
      throw new Error('OpenRouter API key not configured (OPENROUTER_API_KEY)');
    }
    return key;
  }

  /**
   * Embed a single text string via OpenRouter embeddings API
   */
  async embedText(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          input: text,
          dimensions: this.dimensions,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const embedding = response.data?.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response format');
      }

      return embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Embedding API error: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`,
        );
      } else {
        this.logger.error(`Embedding failed: ${error}`);
      }
      throw error;
    }
  }

  /**
   * Embed multiple texts in batches via OpenRouter embeddings API.
   * The API supports batch input natively, so we send up to 100 texts per request.
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const apiKey = this.getApiKey();
    const batchSize = 100; // OpenRouter/OpenAI supports up to 2048 inputs, but 100 is safe
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            input: batch,
            dimensions: this.dimensions,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const data = response.data?.data;
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid batch embedding response format');
        }

        // Sort by index to maintain order (API may return out of order)
        const sorted = data.sort(
          (a: { index: number }, b: { index: number }) => a.index - b.index,
        );

        for (const item of sorted) {
          results.push(item.embedding);
        }

        this.logger.log(
          `Embedded batch ${Math.floor(i / batchSize) + 1}: ${batch.length} texts`,
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          this.logger.error(
            `Batch embedding API error: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`,
          );
        }
        throw error;
      }
    }

    return results;
  }

  onModuleDestroy(): void {
    // No local resources to clean up with API-based approach
  }
}
