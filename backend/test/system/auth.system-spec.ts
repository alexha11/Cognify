import { AuthService } from '../../src/modules/auth/auth.service';
import { OTP_MAX_ATTEMPTS } from '../../src/common/constants';
import {
  client,
  createTestApp,
  resetDatabase,
  signUp,
  TestContext,
} from './helpers';

describe('Sign-in and sessions (system)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('reports healthy with a live database', async () => {
    const res = await client(ctx).get('/api/health').expect(200);
    expect(res.body.data).toEqual({ status: 'ok', database: 'up' });
  });

  it('registers, verifies by emailed code, and keeps the session in an HttpOnly cookie', async () => {
    const agent = client(ctx);
    await agent
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Person',
      })
      .expect(201);

    const code = ctx.email.codes.get('new@example.com');
    expect(code).toMatch(/^\d{6}$/);

    const verify = await agent
      .post('/api/auth/verify-email')
      .send({ email: 'new@example.com', code })
      .expect(200);

    const cookie = String(verify.headers['set-cookie']);
    expect(cookie).toContain('cognify_token=');
    expect(cookie).toContain('HttpOnly');
    expect(JSON.stringify(verify.body)).not.toContain('accessToken');

    const profile = await agent.get('/api/auth/profile').expect(200);
    expect(profile.body.data).toMatchObject({
      email: 'new@example.com',
      role: 'STUDENT',
      hasPassword: true,
    });

    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/profile').expect(401);
  });

  it('rejects wrong passwords, unverified accounts and role escalation', async () => {
    const agent = client(ctx);
    await signUp(ctx, agent, { email: 'login@example.com' });

    await client(ctx)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' })
      .expect(401);

    await client(ctx)
      .post('/api/auth/register')
      .send({
        email: 'pending@example.com',
        password: 'password123',
        firstName: 'P',
        lastName: 'P',
      })
      .expect(201);
    await client(ctx)
      .post('/api/auth/login')
      .send({ email: 'pending@example.com', password: 'password123' })
      .expect(403);

    await agent.put('/api/auth/profile').send({ role: 'ADMIN' }).expect(422);
    const profile = await agent.get('/api/auth/profile').expect(200);
    expect(profile.body.data.role).toBe('STUDENT');
  });

  it('refuses a second code for the same address within the cooldown', async () => {
    await client(ctx)
      .post('/api/auth/register')
      .send({
        email: 'cooldown@example.com',
        password: 'password123',
        firstName: 'C',
        lastName: 'D',
      })
      .expect(201);

    // A different client IP changes nothing: the limit is per address.
    await client(ctx)
      .post('/api/auth/resend-code')
      .send({ email: 'cooldown@example.com' })
      .expect(429);
  });

  it('caps code guesses at the limit even when they arrive at once, without 500s', async () => {
    await client(ctx)
      .post('/api/auth/register')
      .send({
        email: 'race@example.com',
        password: 'password123',
        firstName: 'R',
        lastName: 'R',
      })
      .expect(201);
    const real = ctx.email.codes.get('race@example.com')!;
    const wrong = (i: number) =>
      String((Number(real) + 1 + i) % 1_000_000).padStart(6, '0');

    const burst = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        client(ctx)
          .post('/api/auth/verify-email')
          .send({ email: 'race@example.com', code: wrong(i) }),
      ),
    );

    expect(burst.every((res) => res.status === 400)).toBe(true);
    const invalid = burst.filter((res) =>
      String(res.body.error.message).startsWith('Invalid verification code'),
    );
    expect(invalid.length).toBeLessThanOrEqual(OTP_MAX_ATTEMPTS);

    // The budget is spent, so even the right code is refused now.
    await client(ctx)
      .post('/api/auth/verify-email')
      .send({ email: 'race@example.com', code: real })
      .expect(400);
  });

  it('stops a pre-registered password from surviving Google sign-in (account takeover)', async () => {
    // 1. Someone registers the victim's address with their own password.
    await client(ctx)
      .post('/api/auth/register')
      .send({
        email: 'victim@example.com',
        password: 'attacker-pass-1',
        firstName: 'Attacker',
        lastName: 'Chosen',
        role: 'INSTRUCTOR',
      })
      .expect(201);

    // 2. The real owner signs in with Google (what the OAuth callback runs).
    const google = await ctx.app.get(AuthService).validateGoogleUser({
      googleId: 'google-victim',
      email: 'victim@example.com',
      emailVerified: true,
      firstName: 'Victoria',
      lastName: 'Owner',
    });

    // 3. The pre-registered password no longer works.
    await client(ctx)
      .post('/api/auth/login')
      .send({ email: 'victim@example.com', password: 'attacker-pass-1' })
      .expect(401);

    // The owner's Google session works and shows their own details.
    const profile = await client(ctx)
      .get('/api/auth/profile')
      .set('Cookie', `cognify_token=${google.accessToken}`)
      .expect(200);
    expect(profile.body.data).toMatchObject({
      firstName: 'Victoria',
      lastName: 'Owner',
      role: 'STUDENT',
      hasPassword: false,
    });
  });

  it('answers 404 for Google sign-in when it is not configured', async () => {
    await client(ctx).get('/api/auth/google').expect(404);
  });

  it('changes the password with the current one', async () => {
    const agent = client(ctx);
    await signUp(ctx, agent, { email: 'change@example.com' });

    await agent
      .put('/api/auth/password')
      .send({ currentPassword: 'not-it', newPassword: 'brand-new-pass' })
      .expect(400);
    await agent
      .put('/api/auth/password')
      .send({ currentPassword: 'password123', newPassword: 'brand-new-pass' })
      .expect(200);

    await client(ctx)
      .post('/api/auth/login')
      .send({ email: 'change@example.com', password: 'brand-new-pass' })
      .expect(200);
  });

  it('deletes the account only with the password, and signs out', async () => {
    const agent = client(ctx);
    await signUp(ctx, agent, { email: 'leaving@example.com' });

    await agent
      .delete('/api/auth/account')
      .send({ confirmation: 'DELETE' })
      .expect(400);
    await agent
      .delete('/api/auth/account')
      .send({ confirmation: 'delete please', password: 'password123' })
      .expect(422);

    const res = await agent
      .delete('/api/auth/account')
      .send({ confirmation: 'DELETE', password: 'password123' })
      .expect(200);
    expect(String(res.headers['set-cookie'])).toContain('cognify_token=;');

    await client(ctx)
      .post('/api/auth/login')
      .send({ email: 'leaving@example.com', password: 'password123' })
      .expect(401);
    expect(
      await ctx.prisma.user.count({ where: { email: 'leaving@example.com' } }),
    ).toBe(0);
  });
});
