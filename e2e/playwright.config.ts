import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack browser tests. Expects a migrated database (DATABASE_URL) and
 * built apps; Playwright starts both servers unless they are already running
 * (locally) or E2E_SKIP_WEBSERVER is set.
 *
 * The frontend must be built with NEXT_PUBLIC_API_URL pointing at this API
 * (default http://localhost:3001/api), because Next.js bakes its /api rewrite
 * in at build time.
 */
const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

export default defineConfig({
  testDir: './tests',
  // One worker: tests share one database and one client IP for rate limits.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: FRONTEND_URL,
    trace: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'node dist/src/main.js',
          cwd: '../backend',
          url: `${API_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          env: { PORT: new URL(API_URL).port || '3001' },
        },
        {
          command: `npx next start -p ${new URL(FRONTEND_URL).port || '3000'}`,
          cwd: '../frontend',
          url: FRONTEND_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
