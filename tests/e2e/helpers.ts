import { expect, type Page } from '@playwright/test';

export async function completeSetup(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start with your income' })).toBeVisible();
  await page.getByLabel('Take home income').fill('3000');
  await page.getByRole('combobox', { name: 'Pay frequency' }).selectOption('monthly');
  await page.getByLabel('Work starts').fill('09:00');
  await page.getByLabel('Work ends').fill('17:00');
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(5);
  await expect(page.getByText('8 hours a day, 40 hours a week')).toBeVisible();
  await page.getByRole('radio', { name: 'EUR' }).check();
  await page.getByRole('button', { name: 'Start calculating' }).click();
  await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
}

/**
 * Waits until every animation that ends has ended, such as a page settling in, so a position is
 * measured where the layout puts it rather than part way through a movement.
 */
export async function waitForStillness(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  );
}
