import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { completeSetup } from './helpers';

async function expectAccessible(page: Parameters<typeof completeSetup>[0]) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('Affordi accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('setup has no critical accessibility violations', async ({ page }) => {
    await expectAccessible(page);
  });

  test('calculator and settings have no critical accessibility violations', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('textbox', { name: 'Enter a price' }).fill('750');
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectAccessible(page);
  });

  test('primary flow is keyboard reachable', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'Take-home income' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('combobox', { name: 'Pay frequency' })).toBeFocused();
  });
});
