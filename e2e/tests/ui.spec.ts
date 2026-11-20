import { devices, expect, test, type Cookie, type Page } from '@playwright/test';
import { createSharedCourse, signUpViaApi, uniqueEmail } from './support/fixtures';

/**
 * The landing page only loads its 3D cube on a hardware GPU; headless browsers
 * render WebGL in software. Make WebGL report the given renderer name.
 */
async function reportGpu(page: Page, renderer: string) {
  await page.addInitScript((name) => {
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const original = proto.getParameter;
      proto.getParameter = function (this: WebGLRenderingContext, p: number) {
        return p === UNMASKED_RENDERER_WEBGL ? name : original.call(this, p);
      } as typeof original;
    }
  }, renderer);
}

// One instructor and course for the whole file: sign-up is rate limited.
let instructorCookies: Cookie[];
let courseId: string;

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL });
  await signUpViaApi(api, { email: uniqueEmail('ui'), role: 'INSTRUCTOR' });
  ({ courseId } = await createSharedCourse(api));
  instructorCookies = (await api.storageState()).cookies;
  await api.dispose();
});

test('a dialog sits above the sticky header', async ({ page }) => {
  await page.context().addCookies(instructorCookies);
  await page.goto('/courses');
  await page.locator('button:has(svg.lucide-pencil)').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // The header used to stay bright and clickable over the dialog's backdrop.
  const topmost = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, 20);
    return el?.closest('header') ? 'header' : 'dialog backdrop';
  });
  expect(topmost).toBe('dialog backdrop');
});

test('without a GPU the landing page skips the 3D cube and its code', async ({ page }) => {
  await reportGpu(page, 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))');
  const scripts: string[] = [];
  page.on('response', async (res) => {
    if (res.request().resourceType() === 'script') scripts.push(await res.text().catch(() => ''));
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(2000);

  // A software renderer drew the cube at ~2 fps and blocked the page for seconds.
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(scripts.some((body) => body.includes('WebGLRenderer'))).toBe(false);
});

test('"Forgot password?" leads somewhere', async ({ page }) => {
  await page.goto('/login');
  // It was a button with no handler; there is no reset flow, so it goes to support.
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
    'href',
    '/contact',
  );
});

test.describe('on a phone', () => {
  // The device's own browser type cannot be set per group; the rest can.
  const { defaultBrowserType: _browser, ...iPhone } = devices['iPhone 13'];
  test.use(iPhone);

  test('the course page does not scroll sideways', async ({ page }) => {
    await page.context().addCookies(instructorCookies);
    await page.goto(`/courses/${courseId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // The breadcrumb row was ~100px wider than the screen.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('the landing-page cube does not capture touch scrolling', async ({ page }) => {
    await reportGpu(page, 'Test GPU');
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The cube sits under the hero text on phones and loads as it nears the
    // viewport: walk down the page until it appears.
    const canvas = page.locator('canvas');
    for (let y = 0; y <= 2400 && (await canvas.count()) === 0; y += 300) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(400);
    }
    await canvas.waitFor({ state: 'attached', timeout: 20_000 }).catch(() => {});
    test.skip((await canvas.count()) === 0, 'no WebGL at all in this browser, so no cube');
    await page.waitForTimeout(1500); // let the 3D scene mount its controls

    // Drag-to-rotate set touch-action: none on the canvas wrapper, so a swipe
    // that started on the cube (most of a phone's width) could not scroll.
    const blocksScrolling = await canvas.evaluate((el) => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        if (getComputedStyle(node).touchAction === 'none') return true;
      }
      return false;
    });
    expect(blocksScrolling).toBe(false);
  });
});
