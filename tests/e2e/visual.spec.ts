import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { completeSetup } from './helpers';

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  const screenshot = await page.screenshot({ animations: 'disabled', fullPage });
  expect(screenshot).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: 0.01 });
  await testInfo.attach(name, { body: screenshot, contentType: 'image/png' });
}

test.describe('UI screenshot audit', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'One deterministic browser captures UI audit evidence.');
  });

  test('captures the complete phone setup', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Start with your income' })).toBeVisible();
    await page.getByRole('button', { name: 'Start calculating' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Start calculating' })).toBeInViewport();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.evaluate(() => scrollTo(0, 0));

    await attachScreenshot(page, testInfo, 'phone-setup-light', true);
  });

  test('captures the phone result and verifies Done dismisses the input', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.setViewportSize({ width: 390, height: 500 });

    const price = page.getByRole('textbox', { name: 'Enter a price' });
    await price.fill('1');
    await expect(page.getByText('<0.1% of your monthly take home pay')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
    await attachScreenshot(page, testInfo, 'phone-calculator-entry');

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(price).not.toBeFocused();
    await expect(page.locator('.result-primary')).toBeInViewport();
    await attachScreenshot(page, testInfo, 'phone-calculator-result');
  });

  test('captures the reduced-motion dark theme on a phone', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);

    await page.getByRole('textbox', { name: 'Enter a price' }).fill('750');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.result-primary')).toBeInViewport();

    await attachScreenshot(page, testInfo, 'phone-calculator-dark');
  });
});
