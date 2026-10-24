import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { completeSetup } from './helpers';

/** Wednesday 21 October 2026, in the browser's time zone below. */
const wednesdayMorning = new Date('2026-10-21T11:00:00Z');
const wednesdayNoon = new Date('2026-10-21T12:00:00Z');

test.use({ timezoneId: 'UTC' });

/** Opens earnings and stops the clock exactly at noon, after one tick. */
async function showEarningsAtNoon(page: Page) {
  await page.getByRole('link', { name: 'Earnings' }).click();
  await page.clock.pauseAt(wednesdayNoon.getTime() - 100);
  await page.clock.runFor(100);
}

test.describe('Affordi earnings', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: wednesdayMorning });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('counts today live, around the clock and at work', async ({ page }) => {
    await completeSetup(page);
    await showEarningsAtNoon(page);

    await expect(page).toHaveURL(/#earnings$/);
    await expect(page.getByRole('heading', { name: 'How much do you earn?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Earnings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const amounts = page.locator('.live-amount');
    await expect(amounts).toHaveText(['€49.4505', '€51.9231']);
    await expect(page.getByText('Working until 5:00 PM · 5 hours left')).toBeVisible();

    await page.clock.runFor(60_000);
    await expect(amounts).toHaveText(['€49.5192', '€52.2115']);
    await expect(
      page.getByText('Working until 5:00 PM · 4 hours and 59 minutes left'),
    ).toBeVisible();

    const table = page.getByRole('table', { name: 'Your take home pay, broken down' });
    await expect(table.getByRole('row', { name: /^Per hour/ })).toHaveText(/€4\.12\s*€17\.31/);
    await expect(table.getByRole('row', { name: /^Per month/ })).toHaveText(/€3,000\.00/);
    // Axe waits on timers, so the paused clock runs again for the audit.
    await page.clock.resume();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test('hides every amount and keeps them hidden across pages', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('link', { name: 'Earnings' }).click();

    await page.getByRole('button', { name: 'Hide amounts' }).click();
    const earnings = page.getByRole('region', { name: 'How much do you earn?' });
    await expect(earnings.getByText(/€/)).toHaveCount(0);
    await expect(page.locator('.live-amount')).toHaveText(['••••Hidden', '••••Hidden']);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByRole('link', { name: 'Cost' }).click();
    await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'How much do you earn?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show amounts' })).toBeVisible();
    await expect(earnings.getByText(/€/)).toHaveCount(0);
  });

  test('follows a saved schedule and keeps a short phone viewport usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Work starts').fill('13:00');
    await page.getByLabel('Work ends').fill('00:00');
    await page.getByRole('checkbox', { name: 'Monday' }).uncheck();
    await expect(page.getByText('11 hours a day, 44 hours a week')).toBeVisible();
    await page.getByRole('button', { name: 'Save settings' }).click();
    await page.getByRole('link', { name: 'Earnings' }).click();

    await expect(page.getByText('Starts at 1:00 PM')).toBeVisible();
    await expect(page.locator('.live-amount').nth(1)).toHaveText('€0.0000');
    await expect(page.locator('.live-amount').first()).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
