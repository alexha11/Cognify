import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';

const connectionString = "postgresql://postgres.oanqatixouolgrsiyxsy:Huynhthuvan1%40@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const courseId = 'cbaf6bc4-318f-47b5-9138-dc055f9ae895';
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  
  if (!course) {
    console.error('Course not found');
    process.exit(1);
  }

  const questionsData = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));
  console.log(`Found ${questionsData.length} questions. Inserting...`);
  
  for (const q of questionsData) {
    await prisma.question.create({
      data: {
        content: q.content,
        courseId,
        createdById: course.createdById,
        approved: true,
        answers: {
          create: q.answers,
        },
      },
    });
  }
  
  console.log('Successfully inserted all questions!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
