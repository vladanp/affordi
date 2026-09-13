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
    await page.reload();
    await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Start with your income' })).toHaveCount(0);
  });

  test('updates the time result as a price is entered', async ({ page }) => {
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'Enter a price' });

    await price.fill('750');

    await expect(page.getByText('43 hours of work')).toBeVisible();
    await expect(page.getByText('25% of your take-home pay (monthly)')).toBeVisible();
    await price.fill('-1');
    await expect(page.getByText('Enter a valid non-negative price')).toBeVisible();
  });

  test('edits settings, preserves them after reload, and resets local data', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const income = page.getByRole('textbox', { name: 'Take-home income' });
    await income.fill('4000');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('textbox', { name: 'Take-home income' })).toHaveValue('4000');

    await page.getByRole('button', { name: 'Reset saved settings' }).click();
    await expect(page.getByRole('heading', { name: 'Reset settings?' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Start with your income' })).toBeVisible();
  });

  test('shows useful validation for incomplete setup', async ({ page }) => {
    await page.getByRole('button', { name: 'Start calculating' }).click();
    await expect(page.getByText('Enter an income greater than 0.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Take-home income' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('keeps setup usable in a short phone landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.reload();

    const income = page.getByRole('textbox', { name: 'Take-home income' });
    await expect(income).toBeVisible();
    const inputBox = await income.boundingBox();
    if (inputBox === null) throw new Error('Income input must have a layout box.');
    expect(inputBox.y).toBeLessThan(390);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
