import { expect, request as playwrightRequest, test } from '@playwright/test';
import { createSharedCourse, signUpViaApi, uniqueEmail } from './support/fixtures';

test('a guest takes a shared quiz graded by the server, never seeing the answer key', async ({
  page,
  baseURL,
}) => {
  const instructor = await playwrightRequest.newContext({ baseURL });
  await signUpViaApi(instructor, {
    email: uniqueEmail('teacher'),
    role: 'INSTRUCTOR',
  });
  const { courseId, questionId } = await createSharedCourse(instructor);
  await instructor.dispose();

  const loaded = page.waitForResponse((res) =>
    res.url().includes(`/api/questions/course/${courseId}/public`),
  );
  await page.goto(`/quiz/share/${courseId}`);

  const questionsBody = await (await loaded).text();
  expect(questionsBody).toContain('Paris');
  expect(questionsBody).not.toContain('isCorrect');

  await expect(page.getByText('What is the capital of France?')).toBeVisible();
  await page.getByText('Rome', { exact: true }).click();

  const graded = page.waitForResponse((res) =>
    res.url().endsWith(`/api/questions/${questionId}/check`),
  );
  await page.getByRole('button', { name: /check answer/i }).click();
  const verdict = await (await graded).json();

  expect(verdict.data.isCorrect).toBe(false);
  await expect(page.getByText('Not quite right.')).toBeVisible();
  await expect(page.getByText('It is on the Seine.')).toBeVisible();
});
