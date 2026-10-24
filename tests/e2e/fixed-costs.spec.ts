import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { completeSetup } from './helpers';

test.use({ timezoneId: 'UTC' });

type MonthAndYear = [month: string, year: string];

interface Payments {
  first?: MonthAndYear;
  last?: MonthAndYear;
}

async function choosePayment(dialog: Locator, group: string, value?: MonthAndYear) {
  if (value === undefined) return;
  const fields = dialog.getByRole('group', { name: group });
  await fields.getByRole('combobox', { name: 'Month' }).selectOption(value[0]);
  await fields.getByRole('combobox', { name: 'Year' }).selectOption(value[1]);
}

async function addFixedCost(page: Page, name: string, amount: string, payments: Payments = {}) {
  await page.getByRole('button', { name: 'Add fixed cost' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a fixed cost' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Amount each month' }).fill(amount);
  await choosePayment(dialog, 'First payment', payments.first);
  await choosePayment(dialog, 'Last payment', payments.last);
  await dialog.getByRole('button', { name: 'Add fixed cost' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Affordi fixed costs', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('adds, edits, and deletes fixed costs and keeps them after a reload', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('link', { name: 'Fixed costs' }).click();
    await expect(page).toHaveURL(/#fixed-costs$/);
    await expect(page).toHaveTitle('Fixed costs · Affordi');
    await expect(page.getByRole('heading', { name: 'What do you pay each month?' })).toBeVisible();

    await addFixedCost(page, 'Mortgage', '950', {
      first: ['January', '2024'],
      last: ['March', '2049'],
    });
    await addFixedCost(page, 'Phone', '45');
    const list = page.getByRole('list', { name: 'Your fixed costs' });
    await expect(list.getByRole('listitem')).toHaveText([
      /^Mortgage€950\.006 days and 7 hours of work32%.*€31,350\.00 paid · €256,500\.00 leftLast payment: March 2049$/,
      /^Phone€45\.002 hours and 36 minutes of work2%/,
    ]);
    const loans = page.locator('.fixed-costs-loans');
    await expect(loans).toContainText('€256,500.00');
    await expect(loans).toContainText('€31,350.00 of €287,850.00 paid');
    await expect(page.locator('.fixed-costs-total')).toContainText('€995.00');
    await expect(page.locator('.fixed-costs-total')).toContainText('7 days and 1 hour of work');
    await expect(page.locator('.fixed-costs-left')).toContainText('€2,005.00');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.reload();
    await page.getByRole('button', { name: 'Edit Phone' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit fixed cost' });
    await expect(dialog.getByRole('textbox', { name: 'Amount each month' })).toHaveValue('45');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await dialog.getByRole('textbox', { name: 'Amount each month' }).fill('50');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(list.getByRole('listitem').nth(1)).toContainText('€50.00');
    await expect(page.getByRole('button', { name: 'Edit Phone' })).toBeFocused();

    await page.getByRole('button', { name: 'Edit Phone' }).click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await page
      .getByRole('dialog', { name: 'Delete Phone?' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(list.getByRole('listitem')).toHaveCount(1);

    await page.getByRole('link', { name: 'Earnings' }).click();
    // By noon on 21 October the month's pay has covered the mortgage.
    await expect(page.locator('.earnings-fixed-costs')).toContainText('All covered');
    await expect(page.locator('.earnings-fixed-costs .live-amount')).toHaveText('€950.00');
  });

  test('fits the tabs, the list, and the form on the narrowest phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await completeSetup(page);
    // Each tab label stays on one line and inside its tab.
    const labels = await page
      .getByRole('navigation')
      .getByRole('link')
      .evaluateAll((links) =>
        links.map((link) => {
          const label = link.querySelector('span')!;
          const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
          return {
            oneLine: label.getBoundingClientRect().height < 2 * fontSize,
            inside: label.scrollWidth <= link.clientWidth,
          };
        }),
      );
    expect(labels).toEqual(Array.from({ length: 4 }, () => ({ oneLine: true, inside: true })));

    await page.getByRole('link', { name: 'Fixed costs' }).click();
    await addFixedCost(page, 'Home and contents insurance', '1234.56', {
      first: ['December', '1976'],
      last: ['December', '2075'],
    });
    await page.getByRole('button', { name: 'Edit Home and contents insurance' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeInViewport();
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
