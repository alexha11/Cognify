const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://cognify:cognify_local_password@localhost:5432/cognify',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create Organization
    const orgaId = uuidv4();
    await client.query(
      'INSERT INTO "Organization" (id, name, slug, plan, "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
      [orgaId, 'Cognify Academy', 'cognify-academy', 'FREE']
    );

    // Create Instructor
    const instructorId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(
      'INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "organizationId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [instructorId, 'instructor@cognify.com', hashedPassword, 'Jane', 'Doe', 'INSTRUCTOR', orgaId]
    );

    // Create Course
    const courseId = uuidv4();
    await client.query(
      'INSERT INTO "Course" (id, name, description, "isPublished", "createdById", "organizationId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [courseId, 'Advanced Web Development', 'Master modern frontend and backend technologies with Cognify.', true, instructorId, orgaId]
    );

    // Create Questions
    const topics = ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AI Integration', 'Testing'];
    for (const topic of topics) {
      const questionId = uuidv4();
      await client.query(
        'INSERT INTO "Question" (id, content, hint, "courseId", "createdById", approved, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [questionId, `What is a primary benefit of using ${topic}?`, `Think about ${topic} strengths.`, courseId, instructorId, true]
      );

      // Create Answers
      const answers = [
        { content: `Scalability and efficiency in ${topic}`, isCorrect: true },
        { content: `Lower costs compared to traditional ${topic}`, isCorrect: false },
        { content: `Compatibility with legacy ${topic}`, isCorrect: false },
        { content: `Simplified deployment of ${topic}`, isCorrect: false },
      ];

      for (const answer of answers) {
        await client.query(
          'INSERT INTO "Answer" (id, content, "isCorrect", "questionId") VALUES ($1, $2, $3, $4)',
          [uuidv4(), answer.content, answer.isCorrect, questionId]
        );
      }
    }

    // Create Material
    await client.query(
      'INSERT INTO "Material" (id, "fileName", "fileUrl", "fileType", "fileSize", "courseId", "uploadedById") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), 'Modern_Web_Stack.pdf', 'https://example.com/modern-web.pdf', 'application/pdf', 1024 * 750, courseId, instructorId]
    );

    console.log('Seed data created successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

seed();
