/**
 * Development seed: three accounts (admin, instructor, student), a public
 * course with questions, and a private draft course.
 *
 *   npm run db:seed            (after `npm run db:migrate`)
 *
 * Every account uses SEED_PASSWORD (default "password123"). Safe to re-run:
 * existing accounts and the demo courses are left alone. Refuses to run with
 * NODE_ENV=production.
 */
const { randomUUID } = require('crypto');
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DEMO_COURSE = 'Introduction to Web Development';
const DRAFT_COURSE = 'Advanced Databases (draft)';

const QUESTIONS = [
  {
    content: 'Which HTML element is the right one for the main heading of a page?',
    hint: 'There should usually be only one per page.',
    answers: ['<h1>', '<header>', '<head>', '<title>'],
    correct: 0,
  },
  {
    content: 'Which CSS property controls the space between an element’s border and its content?',
    hint: 'Think inside the box.',
    answers: ['margin', 'padding', 'gap', 'outline'],
    correct: 1,
  },
  {
    content: 'What does `const` guarantee about a JavaScript variable?',
    hint: 'Objects declared with const can still change.',
    answers: [
      'Its value can never change',
      'It cannot be reassigned',
      'It is copied on assignment',
      'It is visible globally',
    ],
    correct: 1,
  },
  {
    content: 'Which HTTP status code means "Not Found"?',
    hint: 'It is in the 4xx range of client errors.',
    answers: ['200', '301', '404', '500'],
    correct: 2,
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database (NODE_ENV=production).');
  }

  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://cognify:cognify_local_password@localhost:5432/cognify',
  });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'password123', 10);

    const ensureUser = async (email, firstName, lastName, role) => {
      const existing = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
      if (existing.rows[0]) return existing.rows[0].id;
      const id = randomUUID();
      await client.query(
        `INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isEmailVerified", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
        [id, email, passwordHash, firstName, lastName, role],
      );
      console.log(`Created ${role.toLowerCase()} ${email}`);
      return id;
    };

    await ensureUser('admin@cognify.local', 'Ada', 'Admin', 'ADMIN');
    const instructorId = await ensureUser('instructor@cognify.local', 'Ivan', 'Instructor', 'INSTRUCTOR');
    await ensureUser('student@cognify.local', 'Sara', 'Student', 'STUDENT');

    const ensureCourse = async (name, description, isPublic, questions) => {
      const existing = await client.query('SELECT id FROM "Course" WHERE name = $1', [name]);
      if (existing.rows[0]) return;

      const courseId = randomUUID();
      await client.query(
        `INSERT INTO "Course" (id, name, description, "isPublic", "createdById", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [courseId, name, description, isPublic, instructorId],
      );

      for (const q of questions) {
        const questionId = randomUUID();
        await client.query(
          `INSERT INTO "Question" (id, content, hint, approved, "courseId", "createdById", "updatedAt")
           VALUES ($1, $2, $3, true, $4, $5, NOW())`,
          [questionId, q.content, q.hint, courseId, instructorId],
        );
        for (const [i, answer] of q.answers.entries()) {
          await client.query(
            'INSERT INTO "Answer" (id, content, "isCorrect", "questionId") VALUES ($1, $2, $3, $4)',
            [randomUUID(), answer, i === q.correct, questionId],
          );
        }
      }
      console.log(`Created course "${name}" with ${questions.length} questions`);
    };

    await ensureCourse(DEMO_COURSE, 'HTML, CSS and JavaScript fundamentals.', true, QUESTIONS);
    await ensureCourse(DRAFT_COURSE, 'Still being written; only its instructor can see it.', false, QUESTIONS.slice(0, 1));

    console.log('Seed complete. Password for all seeded accounts: SEED_PASSWORD or "password123".');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
