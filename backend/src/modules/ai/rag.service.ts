import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { EmbeddingService } from '../embedding';

interface ChunkResult {
  content: string;
  chunkIndex: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * The `topK` chunks of one material closest to `query` by cosine distance
   * (served by the HNSW index), returned in document order.
   */
  async similaritySearch(
    query: string,
    materialId: string,
    topK: number = 5,
  ): Promise<string[]> {
    const queryEmbedding = await this.embeddingService.embedText(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const chunks = await this.prisma.$queryRaw<ChunkResult[]>`
      SELECT content, "chunkIndex"
      FROM "MaterialChunk"
      WHERE "materialId" = ${materialId} AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector ASC
      LIMIT ${topK}`;

    this.logger.log(
      `RAG: Retrieved ${chunks.length} context chunks for material ${materialId}`,
    );

    return [...chunks]
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((c) => c.content);
  }
}
