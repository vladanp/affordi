import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { completeSetup } from './helpers';

/**
 * A full page is captured in a viewport as tall as the page, so the tab bar, which is fixed to
 * the bottom of the screen on a phone, shows below the content instead of across it.
 */
async function attachScreenshot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  const viewport = page.viewportSize()!;
  if (fullPage) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({
      width: viewport.width,
      height: Math.max(height, viewport.height),
    });
  }
  const screenshot = await page.screenshot({ animations: 'disabled' });
  await page.setViewportSize(viewport);
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

    const price = page.getByRole('textbox', { name: 'How much does it cost?' });
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
      '€58.72',
      '€90.86',
      '€1,998.57 of €3,000.00',
    ]);

    await attachScreenshot(page, testInfo, 'phone-earnings', true);
  });

  test('captures the monthly page on a phone at a fixed time', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.evaluate(() => {
      const months = Array.from({ length: 12 }, (_, index) =>
        new Date(Date.UTC(2025, 10 + index, 1)).toISOString().slice(0, 7),
      );
      const entries = (amounts: (number | null)[]) =>
        amounts.flatMap((amount, index) =>
          amount === null ? [] : [{ month: months[index], amount }],
        );
      localStorage.setItem(
        'affordi.fixedCosts.v1',
        JSON.stringify({
          version: 1,
          fixedCosts: [
            {
              id: 'a',
              name: 'Mortgage',
              amount: 950,
              firstPayment: '2019-04',
              lastPayment: '2049-03',
            },
            {
              id: 'b',
              name: 'Car loan',
              amount: 280,
              firstPayment: '2023-07',
              lastPayment: '2028-06',
            },
            // Saved before first payments existed.
            { id: 'c', name: 'Home insurance', amount: 45.5, lastPayment: null },
            { id: 'd', name: 'Netflix', amount: 13.99, firstPayment: null, lastPayment: null },
            {
              id: 'e',
              name: 'Old loan',
              amount: 150,
              firstPayment: '2023-09',
              lastPayment: '2026-08',
            },
          ],
        }),
      );
      localStorage.setItem(
        'affordi.bills.v1',
        JSON.stringify({
          version: 1,
          bills: [
            {
              id: 'e',
              name: 'Electricity',
              entries: entries([92, 118, 135, 128, 104, 88, 71, 66, 74, 79, 83, 91]),
            },
            {
              id: 'h',
              name: 'Heating',
              entries: entries([60, 95, 120, 110, 80, null, null, null, null, null, null, 45]),
            },
            {
              id: 'w',
              name: 'Water',
              entries: entries([31, 30, 33, 29, 32, 34, 36, 41, 44, 39, 35, null]),
            },
          ],
        }),
      );
    });
    await page.goto('/#monthly');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'What do you pay each month?' })).toBeVisible();
    await expect(page.locator('.bill-month-total')).toHaveText('Total €136.00');
    await expect(page.locator('.fixed-costs-loans')).toContainText(
      '€96,420.00 of €358,800.00 paid',
    );
    await attachScreenshot(page, testInfo, 'phone-monthly', true);
  });

  test('captures the reduced-motion dark theme on a phone', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-21T14:15:00Z'));
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);

    await page.getByRole('textbox', { name: 'How much does it cost?' }).fill('750');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.result-primary')).toBeInViewport();
    await expect(page.locator('.result-earned-by')).toHaveText('Earned by October 29');

    await attachScreenshot(page, testInfo, 'phone-calculator-dark');
  });
});
