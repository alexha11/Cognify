import { expect, test } from '@playwright/test';

test('a first-time visitor sees the landing page without a session error', async ({
  page,
}) => {
  const identityCheck = page.waitForResponse((res) =>
    res.url().endsWith('/api/auth/profile'),
  );

  await page.goto('/');

  // Anonymous: the API answers 401, and that must stay silent.
  expect((await identityCheck).status()).toBe(401);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // The old error toast appeared about 450 ms after load and stayed for 6 s.
  await page.waitForTimeout(1500);
  await expect(page.getByText('Session expired or unauthorized')).toHaveCount(0);
});

test('the API reports healthy through the frontend proxy', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).data).toEqual({ status: 'ok', database: 'up' });
});
