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
   * Find the most relevant chunks for a query using cosine similarity
   */
  async similaritySearch(
    query: string,
    materialId: string,
    topK: number = 5,
  ): Promise<string[]> {
    // Embed the query
    const queryEmbedding = await this.embeddingService.embedText(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Find most similar chunks via pgvector cosine distance
    const chunks = await this.prisma.$queryRawUnsafe<ChunkResult[]>(
      `SELECT content, "chunkIndex"
       FROM "MaterialChunk"
       WHERE "materialId" = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector ASC
       LIMIT $3`,
      embeddingStr,
      materialId,
      topK,
    );

    this.logger.log(
      `RAG: Retrieved ${chunks.length} context chunks for material ${materialId}`,
    );

    // Sort by chunkIndex for natural reading order
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    return chunks.map((c) => c.content);
  }
}
