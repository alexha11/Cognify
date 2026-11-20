import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'http';
import request from 'supertest';
import { Role } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma';
import { EmailService } from '../../src/modules/email/email.service';
import { EmbeddingService } from '../../src/modules/embedding';

export type Client = ReturnType<typeof request.agent>;

/** Captures what would have been emailed. */
export class FakeEmailService {
  readonly codes = new Map<string, string>();
  readonly contacts: unknown[] = [];

  sendVerificationEmail(to: string, code: string): Promise<void> {
    this.codes.set(to, code);
    return Promise.resolve();
  }

  sendContactEmail(dto: unknown): Promise<void> {
    this.contacts.push(dto);
    return Promise.resolve();
  }
}

/**
 * Deterministic 512-d bag-of-words vectors: texts that share words point in
 * similar directions, so similarity search behaves meaningfully without an API.
 */
export function fakeEmbedding(text: string): number[] {
  const vector = new Array<number>(512).fill(0);
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    let hash = 0;
    for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    vector[hash % 512] += 1;
  }
  const norm = Math.hypot(...vector);
  if (norm === 0) vector[0] = 1;
  return vector.map((x) => (norm === 0 ? x : x / norm));
}

export const fakeEmbeddingService = {
  embedText: (text: string) => Promise.resolve(fakeEmbedding(text)),
  embedTexts: (texts: string[]) => Promise.resolve(texts.map(fakeEmbedding)),
};

export interface TestContext {
  app: NestExpressApplication;
  http: Server;
  prisma: PrismaService;
  email: FakeEmailService;
}

/** The real AppModule and HTTP pipeline, with email and embeddings faked. */
export async function createTestApp(): Promise<TestContext> {
  const email = new FakeEmailService();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailService)
    .useValue(email)
    .overrideProvider(EmbeddingService)
    .useValue(fakeEmbeddingService)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  configureApp(app);
  // Listen once on an ephemeral port. Otherwise supertest starts a listener per
  // request, and concurrent requests (the OTP race test) collide.
  await app.listen(0, '127.0.0.1');

  return {
    app,
    http: app.getHttpServer(),
    prisma: app.get(PrismaService),
    email,
  };
}

const TABLES = [
  'RoleRequest',
  'CoursePrerequisite',
  'LeaderboardEntry',
  'QuizProgress',
  'Attempt',
  'Answer',
  'Question',
  'MaterialChunk',
  'Material',
  'Course',
  'EmailVerification',
  'Subscription',
  'User',
];

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`,
  );
}

let clientCount = 0;

/**
 * A cookie-keeping HTTP client with its own client IP (the API trusts one
 * proxy hop in tests), so one test's requests never trip another's limits.
 */
export function client(ctx: TestContext, ip?: string): Client {
  clientCount += 1;
  return request
    .agent(ctx.http)
    .set(
      'X-Forwarded-For',
      ip ?? `198.18.${Math.floor(clientCount / 250)}.${clientCount % 250}`,
    );
}

export interface SignUpOptions {
  email: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
  password?: string;
  firstName?: string;
  lastName?: string;
}

/** Registers through the real flow and verifies with the emailed code. */
export async function signUp(
  ctx: TestContext,
  agent: Client,
  {
    email,
    role = 'STUDENT',
    password = 'password123',
    firstName = 'Test',
    lastName = 'User',
  }: SignUpOptions,
): Promise<{ id: string; email: string; role: Role }> {
  await agent
    .post('/api/auth/register')
    .send({ email, password, firstName, lastName, role })
    .expect(201);

  const code = ctx.email.codes.get(email);
  const res = await agent
    .post('/api/auth/verify-email')
    .send({ email, code })
    .expect(200);

  return res.body.data.user;
}

export async function setRole(
  ctx: TestContext,
  userId: string,
  role: Role,
): Promise<void> {
  await ctx.prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function createCourse(
  agent: Client,
  body: { name: string; isPublic?: boolean },
): Promise<{ id: string; name: string }> {
  const res = await agent.post('/api/courses').send(body).expect(201);
  return res.body.data;
}

/** A question whose first answer is the correct one. */
export async function createQuestion(
  agent: Client,
  courseId: string,
  content: string,
): Promise<{ id: string; answers: { id: string; isCorrect: boolean }[] }> {
  const res = await agent
    .post('/api/questions')
    .send({
      courseId,
      content,
      hint: `Hint for ${content}`,
      answers: [
        { content: 'Right', isCorrect: true },
        { content: 'Wrong', isCorrect: false },
        { content: 'Also wrong', isCorrect: false },
      ],
    })
    .expect(201);
  return res.body.data;
}
