export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const { chunkSize = 800, chunkOverlap = 100 } = options;

  if (!text || text.trim().length === 0) return [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // If adding this paragraph would exceed chunk size, finalize current chunk
    if (
      currentChunk.length + trimmed.length + 1 > chunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from end of previous chunk
      if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
        currentChunk = currentChunk.slice(-chunkOverlap) + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else if (trimmed.length > chunkSize) {
      // Paragraph itself exceeds chunk size — split by sentences
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const sentences = splitIntoSentences(trimmed);
      for (const sentence of sentences) {
        if (
          currentChunk.length + sentence.length + 1 > chunkSize &&
          currentChunk.length > 0
        ) {
          chunks.push(currentChunk.trim());
          if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
            currentChunk = currentChunk.slice(-chunkOverlap) + ' ' + sentence;
          } else {
            currentChunk = sentence;
          }
        } else if (sentence.length > chunkSize) {
          // Sentence itself exceeds chunk size — hard split
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          for (let i = 0; i < sentence.length; i += chunkSize - chunkOverlap) {
            chunks.push(sentence.slice(i, i + chunkSize).trim());
          }
        } else {
          currentChunk = currentChunk
            ? currentChunk + ' ' + sentence
            : sentence;
        }
      }
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    }
  }

  // Push any remaining content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Filter out chunks that are too short to be useful
  return chunks.filter((chunk) => chunk.length >= 20);
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (period, exclamation, question mark followed by space or end)
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((s) => s.trim().length > 0);
}
