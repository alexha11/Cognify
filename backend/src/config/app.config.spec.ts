import { appConfigValidationSchema } from './app.config';

/** What a minimal production deployment provides. */
const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@db.example:5432/cognify',
  JWT_SECRET: 'production-jwt-secret-0123456789abcdefghij',
  COOKIE_SECRET: 'production-cookie-secret-0123456789abcdefgh',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  FRONTEND_URL: 'https://cognify.example',
};

const validate = (env: Record<string, string>) =>
  appConfigValidationSchema.validate(env, { abortEarly: false }).error?.message;

describe('appConfigValidationSchema', () => {
  // Requiring the key made the API exit at startup on a deployment without it,
  // which is what failed the production deploy of #7.
  it('starts in production without an email key', () => {
    expect(validate(production)).toBeUndefined();
  });

  it('starts in production with an empty email key', () => {
    expect(validate({ ...production, RESEND_API_KEY: '' })).toBeUndefined();
  });

  it('still requires Google credentials in production', () => {
    const withoutGoogle: Record<string, string> = { ...production };
    delete withoutGoogle.GOOGLE_CLIENT_ID;
    expect(validate(withoutGoogle)).toContain('GOOGLE_CLIENT_ID');
  });

  it('still requires strong session secrets', () => {
    expect(validate({ ...production, JWT_SECRET: 'short' })).toContain(
      'JWT_SECRET',
    );
  });
});
