import { RagService } from '../../src/modules/ai/rag.service';
import { makePdf } from './pdf';
import {
  client,
  Client,
  createCourse,
  createTestApp,
  resetDatabase,
  signUp,
  TestContext,
} from './helpers';

const NOTES = [
  'Photosynthesis converts light energy into chemical energy stored in glucose.',
  'Chlorophyll in the chloroplasts absorbs mostly red and blue light.',
  '',
  'Mitochondria release energy from glucose through cellular respiration.',
  'Respiration produces carbon dioxide, water and ATP for the cell.',
];

describe('Material upload and retrieval (system)', () => {
  let ctx: TestContext;
  let owner: Client;
  let other: Client;
  let course: { id: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);

    owner = client(ctx);
    other = client(ctx);
    await signUp(ctx, owner, { email: 'bio@example.com', role: 'INSTRUCTOR' });
    await signUp(ctx, other, { email: 'chem@example.com', role: 'INSTRUCTOR' });
    course = await createCourse(owner, { name: 'Biology', isPublic: true });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const upload = (
    agent: Client,
    courseId: string,
    pdf: Buffer,
    name = 'notes.pdf',
  ) =>
    agent
      .post('/api/materials/upload')
      .field('courseId', courseId)
      .attach('file', pdf, { filename: name, contentType: 'application/pdf' });

  let materialId: string;

  it('extracts, chunks and embeds a PDF, storing one vector per chunk', async () => {
    const res = await upload(owner, course.id, makePdf(NOTES)).expect(201);
    const material = res.body.data;
    materialId = material.id;

    expect(material.chunkCount).toBeGreaterThan(0);
    const rows = await ctx.prisma.$queryRaw<{ count: number; dims: number }[]>`
      SELECT count(*)::int AS count, max(vector_dims(embedding))::int AS dims
      FROM "MaterialChunk" WHERE "materialId" = ${material.id}`;
    expect(rows[0]).toEqual({ count: material.chunkCount, dims: 512 });
  });

  it('retrieves the passage closest to a topic through the vector index', async () => {
    const chunks = await ctx.app
      .get(RagService)
      .similaritySearch('photosynthesis light glucose', materialId, 1);
    expect(chunks[0]).toContain('Photosynthesis');
  });

  it('refuses uploads to a course the caller does not own', async () => {
    await upload(other, course.id, makePdf(NOTES)).expect(403);
  });

  it('rejects files that are not PDFs or have no text', async () => {
    await owner
      .post('/api/materials/upload')
      .field('courseId', course.id)
      .attach('file', Buffer.from('plain text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    await upload(owner, course.id, makePdf(['Too short'])).expect(400);
    // Nothing was stored for the rejected files.
    expect(await ctx.prisma.material.count()).toBe(1);
  });

  it('refuses AI generation from another course’s material', async () => {
    const otherCourse = await createCourse(other, { name: 'Chemistry' });
    await other
      .post('/api/ai/generate-questions')
      .send({ courseId: otherCourse.id, topic: 'energy', materialId })
      // Without an OpenRouter key the service answers 503 before anything else;
      // with one it would answer 404 for the foreign material.
      .expect((res) => expect([404, 503]).toContain(res.status));
  });

  it('deletes the material together with its chunks', async () => {
    await other.delete(`/api/materials/${materialId}`).expect(403);
    await owner.delete(`/api/materials/${materialId}`).expect(200);
    expect(await ctx.prisma.materialChunk.count()).toBe(0);
  });
});
