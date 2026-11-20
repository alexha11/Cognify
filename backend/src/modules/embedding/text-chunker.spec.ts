import { chunkText } from './text-chunker';

const sentence = (i: number) =>
  `Sentence number ${i} talks about databases and indexes in some detail.`;

describe('chunkText', () => {
  it('returns no chunks for empty or whitespace-only text', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n  ')).toEqual([]);
  });

  it('keeps short paragraphs together in one chunk', () => {
    const text =
      'First paragraph about SQL joins.\n\nSecond paragraph about indexes.';
    expect(chunkText(text)).toEqual([
      'First paragraph about SQL joins.\n\nSecond paragraph about indexes.',
    ]);
  });

  it('splits long text into chunks no longer than size + overlap, with overlap', () => {
    const paragraphs = Array.from({ length: 40 }, (_, i) => sentence(i));
    const chunks = chunkText(paragraphs.join('\n\n'), {
      chunkSize: 300,
      chunkOverlap: 50,
    });

    expect(chunks.length).toBeGreaterThan(5);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(300 + 50 + 2);
    }
    // Each chunk starts with the (trimmed) tail of the previous one.
    expect(chunks[1].startsWith(chunks[0].slice(-50).trim())).toBe(true);
  });

  it('hard-splits a single sentence longer than the chunk size', () => {
    const chunks = chunkText('x'.repeat(2000), {
      chunkSize: 500,
      chunkOverlap: 100,
    });
    expect(chunks.length).toBeGreaterThanOrEqual(4);
    expect(chunks.every((c) => c.length <= 500)).toBe(true);
  });

  it('drops fragments shorter than 20 characters', () => {
    expect(chunkText('Too short.')).toEqual([]);
  });
});
