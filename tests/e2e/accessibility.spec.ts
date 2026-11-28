import { expect, test } from '@playwright/test';

import { completeSetup, expectAccessible } from './helpers';

test.describe('Affordi accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('setup and on-device data dialog have no critical accessibility violations', async ({
    page,
  }) => {
    await expectAccessible(page);
    const dataButton = page.getByRole('button', { name: 'On this device' });
    await dataButton.click();
    await expect(page.getByRole('dialog', { name: 'On this device' })).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(dataButton).toBeFocused();
  });

  test('calculator, settings, and data dialog have no critical accessibility violations', async ({
    page,
  }) => {
    await completeSetup(page);
    await page.getByRole('textbox', { name: 'How much does it cost?' }).fill('750');
    await expectAccessible(page);
    await page.getByRole('combobox', { name: 'How often you pay' }).selectOption('monthly');
    await expect(page.locator('.result-repeat')).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await expectAccessible(page);

    const dataButton = page.getByRole('button', { name: 'On this device' });
    await dataButton.click();
    await expect(page.getByRole('dialog', { name: 'On this device' })).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'On this device' })).toHaveCount(0);
    await expect(dataButton).toBeFocused();
  });

  test('primary flow is keyboard reachable', async ({ browserName, page }) => {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'On this device' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Take home income')).toBeFocused();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByRole('button', { name: 'Hide income' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('combobox', { name: 'Pay frequency' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'USD' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('radio', { name: 'EUR' })).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Work starts')).toBeFocused();
  });

  test('shows focus rings while the keyboard is used and never after a tap or click', async ({
    browserName,
    page,
  }) => {
    const hideIncome = page.getByRole('button', { name: 'Hide income' });
    const payFrequency = page.getByRole('combobox', { name: 'Pay frequency' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(hideIncome).toBeFocused();
    await expect(hideIncome).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Tab');
    await expect(payFrequency).toBeFocused();
    await expect(payFrequency).toHaveCSS('outline-style', 'solid');

    await page.getByLabel('Take home income').click();
    await payFrequency.focus();
    await expect(payFrequency).toBeFocused();
    await expect(payFrequency).toHaveCSS('outline-style', 'none');
  });
});
