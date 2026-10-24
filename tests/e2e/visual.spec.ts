import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { completeSetup } from './helpers';

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  const screenshot = await page.screenshot({ animations: 'disabled', fullPage });
  expect(screenshot).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: 0.01 });
  await testInfo.attach(name, { body: screenshot, contentType: 'image/png' });
}

test.use({ timezoneId: 'UTC' });

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
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.setViewportSize({ width: 390, height: 500 });

    const price = page.getByRole('textbox', { name: 'Enter a price' });
    await price.fill('1');
    await expect(page.locator('.result-share p')).toHaveText('<1% of your monthly take home pay');
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
    await attachScreenshot(page, testInfo, 'phone-calculator-entry');

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(price).not.toBeFocused();
    await expect(page.locator('.result-primary')).toBeInViewport();
    await attachScreenshot(page, testInfo, 'phone-calculator-result');
  });

  test('captures live earnings on a phone at a fixed time', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);

    await page.getByRole('link', { name: 'Earnings' }).click();
    // The hidden page is prerendered with these amounts, so wait until it actually shows.
    await expect(page.getByRole('heading', { name: 'How much do you earn?' })).toBeVisible();
    await expect(page.locator('.live-amount')).toHaveText([
      '€58.7225',
      '€90.8654',
      '€1,998.57 of €3,000.00',
    ]);

    await attachScreenshot(page, testInfo, 'phone-earnings', true);
  });

  test('captures fixed costs on a phone at a fixed time', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.evaluate(() =>
      localStorage.setItem(
        'affordi.fixedCosts.v1',
        JSON.stringify({
          version: 1,
          fixedCosts: [
            { id: 'a', name: 'Mortgage', amount: 950, lastPayment: '2049-03' },
            { id: 'b', name: 'Car loan', amount: 280, lastPayment: '2028-06' },
            { id: 'c', name: 'Home insurance', amount: 45.5, lastPayment: null },
            { id: 'd', name: 'Phone and internet', amount: 59.99, lastPayment: null },
            { id: 'e', name: 'Old loan', amount: 150, lastPayment: '2026-08' },
          ],
        }),
      ),
    );
    await page.goto('/#fixed-costs');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'What do you pay each month?' })).toBeVisible();
    await expect(page.locator('.fixed-costs-total .stat-amount')).toHaveText('€1,335.49');
    await attachScreenshot(page, testInfo, 'phone-fixed-costs', true);
  });

  test('captures the reduced-motion dark theme on a phone', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);

    await page.getByRole('textbox', { name: 'Enter a price' }).fill('750');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.result-primary')).toBeInViewport();
    await expect(page.locator('.result-earned-by')).toHaveText('Earned by October 29');

    await attachScreenshot(page, testInfo, 'phone-calculator-dark');
  });
});
