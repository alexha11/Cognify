import { expect, test } from '@playwright/test';
import { latestVerificationCode, uniqueEmail } from './support/fixtures';

// The sign-up form requires 8+ characters with an uppercase letter and a number.
const FIRST_PASSWORD = 'Password123';
const NEW_PASSWORD = 'Changed-Password-1';

test('sign up, verify by emailed code, change the password, sign in with it', async ({
  page,
  browser,
}) => {
  const email = uniqueEmail('learner');

  await page.goto('/register');
  await page.locator('#firstName').fill('Erin');
  await page.locator('#lastName').fill('Example');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(FIRST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/verify-email/);
  // The first box accepts a pasted code and spreads it across all six.
  await page
    .locator('input[inputmode="numeric"]')
    .first()
    .fill(await latestVerificationCode(email));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/);

  await page.goto('/settings');
  await page.locator('#currentPw').fill(FIRST_PASSWORD);
  await page.locator('#newPw').fill(NEW_PASSWORD);
  await page.locator('#confirmPw').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Password updated successfully.')).toBeVisible();

  // A fresh browser signs in with the new password.
  const fresh = await browser.newContext();
  const second = await fresh.newPage();
  await second.goto('/login');
  await second.locator('#email').fill(email);
  await second.locator('#password').fill(NEW_PASSWORD);
  await second.locator('button[type="submit"]').click();
  await second.waitForURL(/\/dashboard/);
  await fresh.close();
});
