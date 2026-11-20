import { APIRequestContext, expect } from '@playwright/test';
import { Client } from 'pg';

/** Addresses unique to this run, so the suite also works against a reused database. */
export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/**
 * The API runs without an email provider in tests, so verification codes are
 * read straight from the database.
 */
export async function latestVerificationCode(email: string): Promise<string> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ code: string }>(
      `SELECT ev.code FROM "EmailVerification" ev
       JOIN "User" u ON u.id = ev."userId"
       WHERE u.email = $1`,
      [email],
    );
    if (!rows[0]) throw new Error(`No verification code issued for ${email}`);
    return rows[0].code;
  } finally {
    await client.end();
  }
}

/** Signs up and verifies through the API; the context keeps the session cookie. */
export async function signUpViaApi(
  api: APIRequestContext,
  { email, role = 'STUDENT' }: { email: string; role?: 'STUDENT' | 'INSTRUCTOR' },
): Promise<void> {
  const register = await api.post('/api/auth/register', {
    data: { email, password: 'password123', firstName: 'E2E', lastName: 'User', role },
  });
  expect(register.status(), await register.text()).toBe(201);

  const verify = await api.post('/api/auth/verify-email', {
    data: { email, code: await latestVerificationCode(email) },
  });
  expect(verify.status(), await verify.text()).toBe(200);
}

/** A public course with one question: "Capital of France?" → Paris. */
export async function createSharedCourse(
  api: APIRequestContext,
): Promise<{ courseId: string; questionId: string }> {
  const course = await api.post('/api/courses', {
    data: { name: `E2E Geography ${Date.now()}`, isPublic: true },
  });
  expect(course.status(), await course.text()).toBe(201);
  const courseId = (await course.json()).data.id as string;

  const question = await api.post('/api/questions', {
    data: {
      courseId,
      content: 'What is the capital of France?',
      hint: 'It is on the Seine.',
      answers: [
        { content: 'Paris', isCorrect: true },
        { content: 'Rome', isCorrect: false },
        { content: 'Madrid', isCorrect: false },
      ],
    },
  });
  expect(question.status(), await question.text()).toBe(201);

  return { courseId, questionId: (await question.json()).data.id as string };
}
