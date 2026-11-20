/**
 * Runs before each system test file. The suite truncates every table, so it
 * refuses to run unless DATABASE_URL is set in the shell (not just in .env)
 * and names a database whose name contains "test".
 */
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'System tests need DATABASE_URL pointing at a disposable database, migrated with `npm run db:migrate`.',
  );
}
const database = new URL(url).pathname.slice(1);
if (!/test/i.test(database) && process.env.ALLOW_DESTRUCTIVE_TESTS !== 'true') {
  throw new Error(
    `Refusing to run system tests against "${database}": they delete all data. Use a database whose name contains "test".`,
  );
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'system-test-jwt-secret-0123456789abcdef';
process.env.COOKIE_SECRET ??= 'system-test-cookie-secret-0123456789abc';
process.env.TRUSTED_PROXY_HOPS = '1';
// Empty values (not deletions) so a developer's .env cannot fill them in:
// tests never talk to real email, AI, storage or Google.
for (const key of [
  'RESEND_API_KEY',
  'OPENROUTER_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]) {
  process.env[key] = '';
}
