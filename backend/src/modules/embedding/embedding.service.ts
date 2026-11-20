import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Config } from '../../config';
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
} from '../../common/constants';

const EMBEDDING_TIMEOUT_MS = 30_000;

interface EmbeddingResponse {
  data?: { index: number; embedding: number[] }[];
}

/**
 * Text embeddings through OpenRouter. The dimension must match the
 * `vector(512)` column of MaterialChunk.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/embeddings';
  private readonly model = 'openai/text-embedding-3-small';

  constructor(private readonly configService: ConfigService<Config>) {}

  async embedText(text: string): Promise<number[]> {
    const [embedding] = await this.request(text);
    return embedding;
  }

  /** Embeds in batches; the API accepts many inputs per call. */
  async embedTexts(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
      results.push(...(await this.request(batch)));
      this.logger.log(
        `Embedded batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}: ${batch.length} texts`,
      );
    }

    return results;
  }

  private async request(input: string | string[]): Promise<number[][]> {
    const apiKey = this.configService.get('app.openRouterApiKey', {
      infer: true,
    });
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured (OPENROUTER_API_KEY)');
    }

    try {
      const response = await axios.post<EmbeddingResponse>(
        this.apiUrl,
        { model: this.model, input, dimensions: EMBEDDING_DIMENSIONS },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: EMBEDDING_TIMEOUT_MS,
        },
      );

      const data = response.data?.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid embedding response format');
      }

      // The API may return items out of order.
      return [...data]
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      const reason = axios.isAxiosError<{ error?: { message?: string } }>(error)
        ? `${error.response?.status ?? ''} ${error.response?.data?.error?.message ?? error.message}`
        : String(error);
      this.logger.error(`Embedding API error: ${reason}`);
      throw error;
    }
  }
}
