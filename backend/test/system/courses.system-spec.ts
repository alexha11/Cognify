import {
  client,
  Client,
  createCourse,
  createQuestion,
  createTestApp,
  resetDatabase,
  signUp,
  TestContext,
} from './helpers';

describe('Course ownership, privacy and answer keys (system)', () => {
  let ctx: TestContext;
  let owner: Client;
  let other: Client;
  let student: Client;
  let anonymous: Client;
  let publicCourse: { id: string };
  let privateCourse: { id: string };
  let question: { id: string; answers: { id: string; isCorrect: boolean }[] };
  let privateQuestion: { id: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);

    owner = client(ctx);
    other = client(ctx);
    student = client(ctx);
    anonymous = client(ctx);
    await signUp(ctx, owner, {
      email: 'owner@example.com',
      role: 'INSTRUCTOR',
    });
    await signUp(ctx, other, {
      email: 'other@example.com',
      role: 'INSTRUCTOR',
    });
    await signUp(ctx, student, { email: 'student@example.com' });

    publicCourse = await createCourse(owner, {
      name: 'Public',
      isPublic: true,
    });
    privateCourse = await createCourse(owner, {
      name: 'Draft',
      isPublic: false,
    });
    question = await createQuestion(
      owner,
      publicCourse.id,
      'Capital of France?',
    );
    privateQuestion = await createQuestion(owner, privateCourse.id, 'Secret?');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('answer keys', () => {
    it('are never sent to anonymous visitors or students before they answer', async () => {
      const responses = await Promise.all([
        anonymous.get(`/api/questions/course/${publicCourse.id}`).expect(200),
        anonymous
          .get(`/api/questions/course/${publicCourse.id}/public`)
          .expect(200),
        anonymous.get(`/api/questions/${question.id}`).expect(200),
        anonymous.get(`/api/courses/${publicCourse.id}`).expect(200),
        student.get(`/api/questions/course/${publicCourse.id}`).expect(200),
      ]);

      for (const res of responses) {
        expect(JSON.stringify(res.body)).not.toContain('isCorrect');
      }
      expect(responses[0].body.data[0].answers).toHaveLength(3);
    });

    it('are sent to the course owner', async () => {
      const res = await owner
        .get(`/api/questions/course/${publicCourse.id}`)
        .expect(200);
      expect(
        res.body.data[0].answers.some(
          (a: { isCorrect?: boolean }) => a.isCorrect === true,
        ),
      ).toBe(true);
    });

    it('are revealed one question at a time by the guest check endpoint', async () => {
      const right = question.answers.find((a) => a.isCorrect)!;
      const wrong = question.answers.find((a) => !a.isCorrect)!;

      const res = await anonymous
        .post(`/api/questions/${question.id}/check`)
        .send({ selectedAnswerIds: [wrong.id] })
        .expect(200);
      expect(res.body.data).toMatchObject({
        isCorrect: false,
        correctAnswerIds: [right.id],
        question: { id: question.id },
      });

      await anonymous
        .post(`/api/questions/${question.id}/check`)
        .send({ selectedAnswerIds: ['not-an-answer-of-this-question'] })
        .expect(400);
    });
  });

  describe('private courses', () => {
    it('answer 404 to everyone but the owner, on every read path', async () => {
      for (const agent of [anonymous, student, other]) {
        await agent.get(`/api/courses/${privateCourse.id}`).expect(404);
        await agent
          .get(`/api/questions/course/${privateCourse.id}`)
          .expect(404);
        await agent
          .get(`/api/questions/course/${privateCourse.id}/public`)
          .expect(404);
        await agent.get(`/api/questions/${privateQuestion.id}`).expect(404);
        await agent
          .get(`/api/materials/course/${privateCourse.id}`)
          .expect(404);
        await agent.get(`/api/leaderboard/${privateCourse.id}`).expect(404);
        await agent
          .post(`/api/questions/${privateQuestion.id}/check`)
          .send({ selectedAnswerIds: ['x'] })
          .expect(404);
      }
      await owner.get(`/api/courses/${privateCourse.id}`).expect(200);
    });

    it('are listed only for their owner', async () => {
      const list = async (agent: Client) =>
        (await agent.get('/api/courses').expect(200)).body.data.map(
          (c: { id: string }) => c.id,
        );

      expect(await list(anonymous)).toEqual([publicCourse.id]);
      expect(await list(other)).toEqual([publicCourse.id]);
      expect(await list(owner)).toEqual(
        expect.arrayContaining([publicCourse.id, privateCourse.id]),
      );
    });
  });

  describe('ownership', () => {
    const newQuestion = (courseId: string) => ({
      courseId,
      content: 'Injected?',
      answers: [
        { content: 'Yes', isCorrect: true },
        { content: 'No', isCorrect: false },
      ],
    });

    it("stops another instructor from writing into someone else's course", async () => {
      await other
        .post('/api/questions')
        .send(newQuestion(publicCourse.id))
        .expect(403);
      await other
        .post('/api/questions/bulk')
        .send({ questions: [newQuestion(publicCourse.id)] })
        .expect(403);
      await other
        .post('/api/materials')
        .send({
          courseId: publicCourse.id,
          fileName: 'notes.pdf',
          fileUrl: 'https://example.com/notes.pdf',
          fileType: 'application/pdf',
          fileSize: 10,
        })
        .expect(403);
      await other
        .put(`/api/courses/${publicCourse.id}`)
        .send({ name: 'Taken over' })
        .expect(403);
      await other.delete(`/api/courses/${publicCourse.id}`).expect(403);

      const count = await ctx.prisma.question.count({
        where: { courseId: publicCourse.id },
      });
      expect(count).toBe(1);
    });

    it('rejects material links that are not web URLs', async () => {
      await owner
        .post('/api/materials')
        .send({
          courseId: publicCourse.id,
          fileName: 'x.pdf',
          fileUrl: 'javascript:alert(1)',
          fileType: 'application/pdf',
          fileSize: 1,
        })
        .expect(422);
    });

    it('keeps students out of instructor routes', async () => {
      await student.post('/api/courses').send({ name: 'Mine' }).expect(403);
      await student.get('/api/questions/pending').expect(403);
    });

    it('shows each instructor only their own pending questions', async () => {
      await owner
        .put(`/api/questions/${privateQuestion.id}`)
        .send({ approved: false })
        .expect(200);

      const mine = await owner.get('/api/questions/pending').expect(200);
      const theirs = await other.get('/api/questions/pending').expect(200);

      expect(mine.body.data.map((q: { id: string }) => q.id)).toEqual([
        privateQuestion.id,
      ]);
      expect(theirs.body.data).toEqual([]);
    });

    it('still lets the owner see an unapproved question and approve it', async () => {
      const before = await owner
        .get(`/api/questions/course/${privateCourse.id}`)
        .expect(200);
      expect(before.body.data[0]).toMatchObject({
        id: privateQuestion.id,
        approved: false,
      });

      await owner
        .post(`/api/questions/${privateQuestion.id}/approve`)
        .expect(201);
    });
  });

  describe('validation', () => {
    it('answers 422, not 500, for malformed bodies', async () => {
      await owner
        .patch(`/api/courses/${publicCourse.id}/visibility`)
        .send({ isPublic: 'yes', extra: 1 })
        .expect(422);
      await owner
        .post(`/api/courses/${publicCourse.id}/prerequisites`)
        .send({})
        .expect(422);
    });

    it('toggles visibility with a valid body', async () => {
      const res = await owner
        .patch(`/api/courses/${privateCourse.id}/visibility`)
        .send({ isPublic: false })
        .expect(200);
      expect(res.body.data).toMatchObject({ isPublic: false });
    });
  });

  describe('prerequisites', () => {
    it('can be added and removed, but never point at the course itself or loop', async () => {
      const second = await createCourse(owner, {
        name: 'Second',
        isPublic: true,
      });

      await owner
        .post(`/api/courses/${second.id}/prerequisites`)
        .send({ prerequisiteId: publicCourse.id })
        .expect(201);
      await owner
        .post(`/api/courses/${publicCourse.id}/prerequisites`)
        .send({ prerequisiteId: second.id })
        .expect(400);
      await owner
        .post(`/api/courses/${second.id}/prerequisites`)
        .send({ prerequisiteId: second.id })
        .expect(400);

      const detail = await student.get(`/api/courses/${second.id}`).expect(200);
      expect(detail.body.data.prerequisites).toEqual([
        { id: publicCourse.id, name: 'Public' },
      ]);
      expect(detail.body.data.prerequisitesMet).toBe(false);

      await owner
        .delete(`/api/courses/${second.id}/prerequisites/${publicCourse.id}`)
        .expect(200);
      await owner
        .delete(`/api/courses/${second.id}/prerequisites/${publicCourse.id}`)
        .expect(404);
    });
  });
});
