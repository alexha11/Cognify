import { Role } from '@prisma/client';
import {
  client,
  Client,
  createCourse,
  createQuestion,
  createTestApp,
  resetDatabase,
  setRole,
  signUp,
  TestContext,
} from './helpers';

describe('Quizzes, scores, analytics and role requests (system)', () => {
  let ctx: TestContext;
  let owner: Client;
  let student: Client;
  let course: { id: string };
  let questions: {
    id: string;
    answers: { id: string; isCorrect: boolean }[];
  }[];

  const correctId = (i: number) =>
    questions[i].answers.find((a) => a.isCorrect)!.id;
  const wrongId = (i: number) =>
    questions[i].answers.find((a) => !a.isCorrect)!.id;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);

    owner = client(ctx);
    student = client(ctx);
    await signUp(ctx, owner, {
      email: 'teacher@example.com',
      role: 'INSTRUCTOR',
    });
    await signUp(ctx, student, { email: 'learner@example.com' });

    course = await createCourse(owner, { name: 'Geography', isPublic: true });
    questions = [];
    for (const content of ['Q1?', 'Q2?', 'Q3?', 'Q4?']) {
      questions.push(await createQuestion(owner, course.id, content));
    }
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('attempts and progress', () => {
    it('scores answers on the server', async () => {
      const wrong = await student
        .post('/api/attempts')
        .send({ questionId: questions[0].id, selectedAnswerIds: [wrongId(0)] })
        .expect(201);
      expect(wrong.body.data).toMatchObject({
        isCorrect: false,
        correctAnswerIds: [correctId(0)],
      });

      for (const i of [1, 2]) {
        await student
          .post('/api/attempts')
          .send({
            questionId: questions[i].id,
            selectedAnswerIds: [correctId(i)],
          })
          .expect(201);
      }
    });

    it('reads quiz progress without writing a row', async () => {
      const before = await ctx.prisma.quizProgress.count();
      const res = await student
        .get(`/api/attempts/progress/${course.id}`)
        .expect(200);
      expect(res.body.data).toMatchObject({
        currentIndex: 0,
        isCompleted: false,
      });
      expect(await ctx.prisma.quizProgress.count()).toBe(before);

      await student
        .post(`/api/attempts/progress/${course.id}`)
        .send({ currentIndex: 2 })
        .expect(201);
      expect(await ctx.prisma.quizProgress.count()).toBe(before + 1);
    });

    it('answers 404 for progress in a course that does not exist', async () => {
      await student
        .get('/api/attempts/progress/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('leaderboard', () => {
    it('scores signed-in players from their attempts, whatever they submit', async () => {
      const res = await student
        .post('/api/leaderboard')
        .send({ courseId: course.id, score: 999, totalQuestions: 1 })
        .expect(201);
      expect(res.body.data).toMatchObject({
        score: 2,
        totalQuestions: 4,
        percentage: 50,
        isGuest: false,
      });
    });

    it('caps guest scores at the real number of questions', async () => {
      await client(ctx)
        .post('/api/leaderboard')
        .send({ courseId: course.id, score: 999, totalQuestions: 1 })
        .expect(400);

      const res = await client(ctx)
        .post('/api/leaderboard')
        .send({ courseId: course.id, score: 3, guestName: '  Visitor  ' })
        .expect(201);
      expect(res.body.data).toMatchObject({
        displayName: 'Visitor',
        percentage: 75,
        isGuest: true,
      });
    });

    it('ranks each player by their best entry', async () => {
      const res = await client(ctx)
        .get(`/api/leaderboard/${course.id}`)
        .expect(200);
      const entries = res.body.data.entries;

      expect(res.body.data.courseName).toBe('Geography');
      expect(entries.map((e: { percentage: number }) => e.percentage)).toEqual([
        75, 50,
      ]);
      expect(entries[0]).toMatchObject({
        displayName: 'Visitor',
        isGuest: true,
      });
    });
  });

  describe('instructor analytics', () => {
    it("aggregates every learner's results in the instructor's courses", async () => {
      const res = await owner.get('/api/attempts/analytics').expect(200);
      expect(res.body.data).toEqual([
        expect.objectContaining({
          courseId: course.id,
          totalQuestions: 4,
          learners: 1,
          answered: 3,
          correct: 2,
          accuracy: 67,
        }),
      ]);
    });

    it('is not available to students', async () => {
      await student.get('/api/attempts/analytics').expect(403);
    });
  });

  describe('instructor-access requests', () => {
    it('lets a student ask once and an admin approve, promoting them', async () => {
      const applicant = client(ctx);
      const admin = client(ctx);
      await signUp(ctx, applicant, { email: 'applicant@example.com' });
      const adminUser = await signUp(ctx, admin, {
        email: 'admin@example.com',
      });
      await setRole(ctx, adminUser.id, Role.ADMIN);

      const created = await applicant
        .post('/api/access-control/request-role')
        .send({ reason: 'I teach geography' })
        .expect(201);
      await applicant
        .post('/api/access-control/request-role')
        .send({ reason: 'Again' })
        .expect(400);

      const mine = await applicant
        .get('/api/access-control/my-request')
        .expect(200);
      expect(mine.body.data).toMatchObject({ status: 'PENDING' });

      await applicant.get('/api/access-control/requests').expect(403);
      const all = await admin.get('/api/access-control/requests').expect(200);
      expect(all.body.data).toHaveLength(1);

      await admin
        .patch(`/api/access-control/requests/${created.body.data.id}/status`)
        .send({ status: 'PENDING' })
        .expect(422);
      await admin
        .patch(`/api/access-control/requests/${created.body.data.id}/status`)
        .send({ status: 'APPROVED' })
        .expect(200);
      await admin
        .patch(`/api/access-control/requests/${created.body.data.id}/status`)
        .send({ status: 'REJECTED' })
        .expect(400);

      const profile = await applicant.get('/api/auth/profile').expect(200);
      expect(profile.body.data.role).toBe('INSTRUCTOR');
    });
  });

  describe('contact form', () => {
    it('accepts a valid message and rejects oversized ones', async () => {
      await client(ctx)
        .post('/api/contact')
        .send({
          name: 'Visitor',
          email: 'visitor@example.com',
          category: 'Technical Issue',
          message: 'The quiz page does not load.',
        })
        .expect(200);
      expect(ctx.email.contacts).toHaveLength(1);

      await client(ctx)
        .post('/api/contact')
        .send({
          name: 'Visitor',
          email: 'visitor@example.com',
          category: 'Other',
          message: 'x'.repeat(5001),
        })
        .expect(422);
    });
  });
});
