import { expect, test } from '@playwright/test';

import { completeSetup } from './helpers';

test.describe('Affordi calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('completes setup and lands on the calculator', async ({ page }) => {
    await completeSetup(page);

    await expect(page.getByText('Enter a price to see its time cost.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter a price' })).not.toBeFocused();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter a price' })).not.toBeFocused();
    await expect(page.getByRole('heading', { name: 'Start with your income' })).toHaveCount(0);
  });

  test('updates the time result as a price is entered', async ({ page }) => {
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'Enter a price' });

    await price.fill('750');

    await expect(page.getByText('43 hours of work')).toBeVisible();
    await expect(page.getByText('25.0% of your monthly take home pay')).toBeVisible();
    await price.fill('-1');
    await expect(page.getByText('Enter a price of 0 or more.')).toBeVisible();
    await price.fill('36.5');
    await expect(page.getByText('2 hours and 7 minutes of work')).toBeVisible();
    await price.fill('36,5');
    await expect(page.getByText('2 hours and 7 minutes of work')).toBeVisible();
  });

  test('keeps income private until the user reveals it', async ({ page }) => {
    const income = page.getByLabel('Take home income');

    await income.fill('3000.50');
    await expect(income).toHaveAttribute('type', 'password');
    await expect(page.getByText('Saved only on this device.')).toBeVisible();
    await page.getByRole('button', { name: 'Show income' }).click();
    await expect(income).toHaveAttribute('type', 'text');
    await expect(income).toHaveValue('3000.50');
    await page.getByRole('button', { name: 'Hide income' }).click();
    await expect(income).toHaveAttribute('type', 'password');
  });

  test('aligns the primary setup controls in Chromium', async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'This check targets the requested Chrome layout audit.');

    await page.setViewportSize({ width: 900, height: 900 });
    await page.reload();

    const income = await page.getByLabel('Take home income').boundingBox();
    const frequency = await page.getByLabel('Pay frequency').boundingBox();
    const note = await page.getByText('Saved only on this device.').boundingBox();

    if (income === null || frequency === null || note === null) {
      throw new Error('Setup controls and privacy note must have layout boxes.');
    }

    expect(Math.abs(income.y - frequency.y)).toBeLessThan(2);
    expect(Math.abs(income.height - frequency.height)).toBeLessThan(2);
    expect(note.y).toBeGreaterThan(
      Math.max(income.y + income.height, frequency.y + frequency.height),
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('edits settings, preserves them after reload, and resets local data', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const income = page.getByLabel('Take home income');
    await income.fill('4000');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByLabel('Take home income')).toHaveValue('4000');
    await expect(page.getByText('Saved only on this device.')).toBeVisible();

    await page.getByRole('button', { name: 'Reset saved settings' }).click();
    await expect(page.getByRole('heading', { name: 'Reset settings?' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Start with your income' })).toBeVisible();
  });

  test('shows useful validation for incomplete setup', async ({ page }) => {
    await page.getByRole('button', { name: 'Start calculating' }).click();
    await expect(page.getByText('Enter an income greater than 0.')).toBeVisible();
    await expect(page.getByLabel('Take home income')).toHaveAttribute('aria-invalid', 'true');
  });

  test('keeps setup usable in a short phone landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.reload();

    const income = page.getByLabel('Take home income');
    await expect(income).toBeVisible();
    const inputBox = await income.boundingBox();
    if (inputBox === null) throw new Error('Income input must have a layout box.');
    expect(inputBox.y).toBeLessThan(390);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('keeps every setup field accessible in a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(page.getByLabel('Currency')).toBeVisible();
    await expect(page.getByLabel('Work hours each week')).toBeVisible();
    await expect(page.getByLabel('Work days each week')).toBeVisible();
    await expect(page.locator('details')).toHaveCount(0);
    await page.getByRole('button', { name: 'Start calculating' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Start calculating' })).toBeInViewport();
  });

  test('keeps result context stable when the unit changes to weeks', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'Enter a price' });

    await price.fill('1300');
    const hoursPosition = await page.locator('.result-secondary').boundingBox();
    await price.fill('1400');
    await expect(page.locator('.result-primary')).toHaveText('2 weeks');
    const weeksPosition = await page.locator('.result-secondary').boundingBox();

    if (hoursPosition === null || weeksPosition === null) {
      throw new Error('Result context must have a stable layout box.');
    }
    expect(Math.abs(hoursPosition.y - weeksPosition.y)).toBeLessThan(2);
  });

  test('keeps Serbian result context fixed as the price gains a digit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('combobox', { name: 'Language' }).selectOption('sr');
    await page.getByRole('button', { name: 'Sačuvaj podešavanja' }).click();

    const price = page.getByRole('textbox', { name: 'Unesite cenu' });
    await price.fill('36');
    const firstFontSize = await page
      .locator('.result-primary')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('font-size'));
    const firstHeadline = await page.locator('.result-primary').boundingBox();
    const firstPosition = await page.locator('.result-secondary').boundingBox();
    await price.fill('360');
    const secondFontSize = await page
      .locator('.result-primary')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('font-size'));
    const secondHeadline = await page.locator('.result-primary').boundingBox();
    const secondPosition = await page.locator('.result-secondary').boundingBox();

    if (
      firstHeadline === null ||
      firstPosition === null ||
      secondHeadline === null ||
      secondPosition === null
    ) {
      throw new Error('Result context must have a stable layout box.');
    }
    expect(firstPosition.y + firstPosition.height).toBeLessThanOrEqual(firstHeadline.y);
    expect(secondPosition.y + secondPosition.height).toBeLessThanOrEqual(secondHeadline.y);
    expect(Math.abs(firstPosition.y - secondPosition.y)).toBeLessThan(2);
    expect(Math.abs(firstHeadline.y - secondHeadline.y)).toBeLessThan(2);
    expect(firstFontSize).toBe(secondFontSize);
  });
});
