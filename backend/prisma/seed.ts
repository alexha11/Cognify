import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create an orga
  const orga = await prisma.organization.create({
    data: {
      name: 'Test University',
      slug: 'test-university',
    },
  });

  // Create an instructor
  const hashedPassword = await bcrypt.hash('password123', 10);
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@test.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'Instructor',
      role: 'INSTRUCTOR',
      organizationId: orga.id,
    },
  });

  // Create a course
  const course = await prisma.course.create({
    data: {
      name: 'Introduction to AI',
      description: 'Learn the basics of Artificial Intelligence.',
      isPublished: true,
      createdById: instructor.id,
      organizationId: orga.id,
    },
  });

  // Create some questions
  const topics = ['History', 'Algorithms', 'Applications', 'Neural Networks', 'Ethics', 'Future'];
  
  for (let i = 0; i < topics.length; i++) {
    await prisma.question.create({
      data: {
        content: `What is a key concept in AI ${topics[i]}?`,
        hint: `Think about ${topics[i]} basics.`,
        courseId: course.id,
        approved: true,
        createdById: instructor.id,
        answers: {
          create: [
            { content: `Option A for ${topics[i]}`, isCorrect: true },
            { content: `Option B for ${topics[i]}`, isCorrect: false },
            { content: `Option C for ${topics[i]}`, isCorrect: false },
            { content: `Option D for ${topics[i]}`, isCorrect: false },
          ],
        },
      },
    });
  }

  // Create a material
  await prisma.material.create({
    data: {
      fileName: 'AI_Course_Syllabus.pdf',
      fileUrl: 'https://example.com/syllabus.pdf',
      fileSize: 1024 * 500, // 500 KB
      fileType: 'application/pdf',
      courseId: course.id,
      uploadedById: instructor.id,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
