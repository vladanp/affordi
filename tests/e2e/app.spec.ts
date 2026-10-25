import { expect, test } from '@playwright/test';

import { completeSetup, waitForStillness } from './helpers';

test.describe('Affordi calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('completes setup and lands on the calculator', async ({ page }) => {
    await completeSetup(page);

    await expect(page.locator('.result-card')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'How much does it cost?' })).not.toBeFocused();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'How much does it cost?' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'How much does it cost?' })).not.toBeFocused();
    await expect(page.getByRole('heading', { name: 'Start with your income' })).toHaveCount(0);
  });

  test('updates the time result as a price is entered', async ({ page }) => {
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'How much does it cost?' });

    await price.fill('750');

    await expect(page.locator('.result-primary')).toHaveText('€750.00 is 43 hours of work');
    await expect(page.locator('.result-approx')).toHaveText('≈ 5 days and 3 hours');
    await expect(page.locator('.result-share p')).toHaveText('25% of your monthly take home pay');
    await expect(page.locator('.share-segment')).toHaveCount(1);
    await price.fill('11250');
    await expect(page.locator('.result-share p')).toHaveText('375% of your monthly take home pay');
    await expect(page.locator('.share-multiple')).toHaveText('3.8×');
    await expect(page.locator('.share-segment')).toHaveCount(4);
    await price.fill('-1');
    await expect(page.locator('#price-error')).toBeVisible();
    await expect(price).toHaveAttribute('aria-invalid', 'true');
    await price.fill('36.5');
    await expect(page.locator('.result-primary')).toHaveText(
      '€36.50 is 2 hours and 7 minutes of work',
    );
    await price.fill('36,5');
    await expect(page.locator('.result-primary')).toHaveText(
      '€36.50 is 2 hours and 7 minutes of work',
    );
  });

  test('says when a price will have been earned, working from now', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'How much does it cost?' });

    await price.fill('100');
    await expect(page.locator('.result-earned-by')).toHaveText('Earned by 9:46 AM tomorrow');
    await price.fill('750');
    await expect(page.locator('.result-earned-by')).toHaveText('Earned by October 28');
    await page.getByRole('combobox', { name: 'How often you pay' }).selectOption('monthly');
    await expect(page.locator('.result-earned-by')).toHaveCount(0);
  });

  test('shows recurring prices with the other period as context', async ({ page }) => {
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'How much does it cost?' });
    const repeat = page.getByRole('combobox', { name: 'How often you pay' });

    await price.fill('900');
    await expect(page.locator('.result-repeat')).toHaveCount(0);

    await repeat.selectOption('monthly');
    await price.fill('12.99');
    await expect(page.locator('.result-primary')).toHaveText(
      '€12.99 a month is 45 minutes of work',
    );
    await expect(page.locator('.result-repeat')).toHaveText('Over a year: 9 hours');
    await expect(page.locator('.result-share p')).toHaveText('<1% of your monthly take home pay');

    await repeat.selectOption('yearly');
    await expect(page.locator('.result-primary')).toHaveText('€12.99 a year is 45 minutes of work');
    await expect(page.locator('.result-repeat')).toHaveText('Each month: 4 minutes');
    await expect(page.locator('.result-share p')).toHaveText('<1% of your yearly take home pay');

    await price.fill('4.50');
    await repeat.selectOption('workday');
    await expect(page.locator('.result-primary')).toHaveText(
      '€4.50 every workday is 16 minutes of work',
    );
    await expect(page.locator('.result-repeat')).toHaveText('Over a year: 68 hours');
  });

  test('keeps every field at 16px or more so iOS never zooms in on focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const smallFields = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('input:not([type="radio"]), select')]
          .filter((field) => field.getClientRects().length > 0)
          .filter((field) => Number.parseFloat(getComputedStyle(field).fontSize) < 16)
          .map((field) => field.id),
      );

    await page.reload();
    expect(await smallFields()).toEqual([]);
    await completeSetup(page);
    expect(await smallFields()).toEqual([]);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await smallFields()).toEqual([]);
  });

  test('shows income during setup and masks it on request', async ({ page }) => {
    const income = page.getByLabel('Take home income');

    await income.pressSequentially('3000.50');
    await expect(income).toHaveAttribute('data-masked', 'false');
    await expect(income).toHaveCSS('-webkit-text-security', 'none');
    const shown = await income.screenshot();

    await page.getByRole('button', { name: 'Hide income' }).click();
    await expect(income).toHaveAttribute('data-masked', 'true');
    await expect(income).toHaveCSS('-webkit-text-security', 'disc');
    await expect(income).toHaveValue('3000.50');
    const masked = await income.screenshot();

    await page.getByRole('button', { name: 'Show income' }).click();
    await expect(income).toHaveAttribute('data-masked', 'false');
    const revealed = await income.screenshot();

    // Compare rendered pixels, because WebKit can keep drawing discs after the style changes.
    expect(masked.equals(shown)).toBe(false);
    expect(revealed.equals(masked)).toBe(false);
  });

  test('keeps the settings actions in reach on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();

    const save = page.getByRole('button', { name: 'Save', exact: true });
    const cancel = page.getByRole('button', { name: 'Cancel' });
    await expect(save).toBeInViewport();
    await expect(cancel).toBeInViewport();
    const [cancelBox, saveBox] = await Promise.all([cancel.boundingBox(), save.boundingBox()]);
    expect(Math.abs(cancelBox!.y - saveBox!.y)).toBeLessThan(1);
    await page.getByLabel('Take home income').focus();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeInViewport();
  });

  test('keeps saved income masked when settings open', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();

    const income = page.getByLabel('Take home income');
    await expect(income).toHaveAttribute('data-masked', 'true');
    await expect(income).toHaveCSS('-webkit-text-security', 'disc');
    await expect(page.getByRole('button', { name: 'Show income' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('aligns the primary setup controls in Chromium', async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'This check targets the requested Chrome layout audit.');

    await page.setViewportSize({ width: 900, height: 900 });
    await page.reload();

    const income = await page
      .locator('.input-with-prefix')
      .filter({ has: page.getByLabel('Take home income') })
      .boundingBox();
    const frequency = await page.getByLabel('Pay frequency').boundingBox();

    if (income === null || frequency === null) {
      throw new Error('Setup controls must have layout boxes.');
    }

    expect(Math.abs(income.y - frequency.y)).toBeLessThan(2);
    expect(Math.abs(income.height - frequency.height)).toBeLessThan(2);
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
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByLabel('Take home income')).toHaveValue('4000');

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

    await expect(page.getByRole('group', { name: 'Currency' })).toBeVisible();
    await expect(page.getByLabel('Work starts')).toBeVisible();
    await expect(page.getByLabel('Work ends')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Work days' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Sunday' })).toBeVisible();
    await expect(page.locator('details')).toHaveCount(0);
    await page.getByRole('button', { name: 'Start calculating' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Start calculating' })).toBeInViewport();
  });

  test('keeps result context stable when the unit changes to weeks', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    const price = page.getByRole('textbox', { name: 'How much does it cost?' });

    await price.fill('1300');
    await expect(page.locator('.result-primary')).toHaveText('€1,300.00 is 75 hours of work');
    await waitForStillness(page);
    const hoursPosition = await page.locator('.result-share').boundingBox();
    await price.fill('1400');
    await expect(page.locator('.result-primary')).toHaveText('€1,400.00 is 2 weeks');
    await expect(page.locator('.result-approx')).toHaveText('≈ 81 hours');
    await waitForStillness(page);
    const weeksPosition = await page.locator('.result-share').boundingBox();

    if (hoursPosition === null || weeksPosition === null) {
      throw new Error('Result context must have a stable layout box.');
    }
    expect(Math.abs(hoursPosition.y - weeksPosition.y)).toBeLessThan(2);
  });

  test('keeps Serbian result context fixed as the headline grows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await completeSetup(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('combobox', { name: 'Language' }).selectOption('sr');
    await page.getByRole('button', { name: 'Sačuvaj', exact: true }).click();

    const price = page.getByRole('textbox', { name: 'Koliko to košta u vremenu?' });
    await price.fill('36');
    await waitForStillness(page);
    const firstFontSize = await page
      .locator('.result-primary')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('font-size'));
    const firstHeadline = await page.locator('.result-primary').boundingBox();
    const firstPosition = await page.locator('.result-share').boundingBox();
    await price.fill('360');
    await waitForStillness(page);
    const secondFontSize = await page
      .locator('.result-primary')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('font-size'));
    const secondHeadline = await page.locator('.result-primary').boundingBox();
    const secondPosition = await page.locator('.result-share').boundingBox();

    if (
      firstHeadline === null ||
      firstPosition === null ||
      secondHeadline === null ||
      secondPosition === null
    ) {
      throw new Error('Result context must have a stable layout box.');
    }
    expect(firstHeadline.y + firstHeadline.height).toBeLessThanOrEqual(firstPosition.y);
    expect(secondHeadline.y + secondHeadline.height).toBeLessThanOrEqual(secondPosition.y);
    expect(Math.abs(firstPosition.y - secondPosition.y)).toBeLessThan(2);
    expect(Math.abs(firstHeadline.y - secondHeadline.y)).toBeLessThan(2);
    expect(firstFontSize).toBe(secondFontSize);
  });
});
