import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { completeSetup } from './helpers';

test.use({ timezoneId: 'UTC' });

type MonthAndYear = [month: string, year: string];

interface Payments {
  first?: MonthAndYear;
  last?: MonthAndYear;
}

async function expectAccessible(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
}

async function openMonthly(page: Page) {
  await page.getByRole('link', { name: 'Monthly' }).click();
  await expect(page).toHaveURL(/#monthly$/);
  await expect(page.getByRole('heading', { name: 'What do you pay each month?' })).toBeVisible();
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

async function addBill(page: Page, name: string, amount?: string) {
  await page.getByRole('button', { name: 'Add bill' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a bill' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
  if (amount !== undefined) {
    await dialog.getByRole('textbox', { name: /^Amount for / }).fill(amount);
  }
  await dialog.getByRole('button', { name: 'Add bill' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Affordi monthly page', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('adds, edits, and deletes fixed costs and keeps them after a reload', async ({ page }) => {
    await completeSetup(page);
    await openMonthly(page);
    await expect(page).toHaveTitle('Monthly · Affordi');

    await addFixedCost(page, 'Mortgage', '950', {
      first: ['January', '2024'],
      last: ['March', '2049'],
    });
    await addFixedCost(page, 'Phone', '45');
    const list = page.getByRole('list', { name: 'Fixed costs' });
    await expect(list.getByRole('listitem')).toHaveText([
      /^Mortgage€950\.006 days and 7 hours of work32%.*€31,350\.00 paid · €256,500\.00 leftLast payment: March 2049$/,
      /^Phone€45\.002 hours and 36 minutes of work2%/,
    ]);
    const total = page.locator('.monthly-total');
    await expect(total).toContainText('€995.00');
    await expect(total).toContainText('7 days and 1 hour of work');
    await expect(page.locator('.monthly-left')).toContainText('€2,005.00');
    const loans = page.locator('.fixed-costs-loans');
    await expect(loans).toContainText('€256,500.00');
    await expect(loans).toContainText('€31,350.00 of €287,850.00 paid');
    // The phone bill keeps going, so it is no loan.
    await expect(loans).toContainText('For Mortgage');
    await expect(loans).not.toContainText('Phone');
    await expectAccessible(page);

    await page.reload();
    await page.getByRole('button', { name: 'Edit Phone' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit fixed cost' });
    await expect(dialog.getByRole('textbox', { name: 'Amount each month' })).toHaveValue('45');
    await expectAccessible(page);
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

  test('enters bills month by month and averages them', async ({ page }) => {
    await completeSetup(page);
    await openMonthly(page);

    await addBill(page, 'Electricity', '91');
    await addBill(page, 'Water');
    const monthTitle = page.getByRole('heading', { level: 3 });
    const monthTotal = page.locator('.bill-month-total');
    const amount = (name: string) => page.getByRole('textbox', { name, exact: true });
    await expect(monthTitle).toHaveText('October 2026');
    await expect(amount('Electricity')).toHaveValue('91.00');
    await amount('Water').fill('34');
    await amount('Water').press('Enter');
    await expect(amount('Water')).toHaveValue('34.00');
    await expect(monthTotal).toHaveText('Total €125.00');

    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect(monthTitle).toHaveText('September 2026');
    await expect(amount('Electricity')).toHaveValue('');
    await amount('Electricity').fill('79');
    await amount('Electricity').press('Enter');
    await expect(amount('Water')).toBeFocused();
    await expect(monthTotal).toHaveText('Total €79.00');

    // Electricity averages €85 over two months and water €34 over one.
    await expect(page.locator('.monthly-total')).toContainText('€119.00');
    await expect(page.locator('.monthly-left')).toContainText('€2,881.00');
    await expect(page.getByText('Average €85.00 · 7% below average')).toBeVisible();

    const chart = page.getByRole('group', { name: 'Bills per month' });
    await chart.focus();
    await page.keyboard.press('End');
    await expect(monthTitle).toHaveText('October 2026');
    await page.keyboard.press('Home');
    await expect(monthTitle).toHaveText('November 2025');
    await expect(monthTotal).toHaveText('No amounts yet.');
    // The month's name opens a list of the last twelve months.
    await page.getByRole('combobox', { name: 'Choose a month' }).selectOption('2026-09');
    await expect(monthTitle).toHaveText('September 2026');
    await expect(amount('Electricity')).toHaveValue('79.00');
    await expectAccessible(page);

    await page.reload();
    await expect(monthTitle).toHaveText('October 2026');
    await expect(amount('Electricity')).toHaveValue('91.00');
    await page.getByRole('button', { name: 'Edit Water' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit bill' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Water and sewage');
    await expectAccessible(page);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(amount('Water and sewage')).toHaveValue('34.00');

    await page.getByRole('link', { name: 'Earnings' }).click();
    const coverage = page.locator('.earnings-fixed-costs');
    await expect(coverage).toContainText('Fixed costs and bills this month');
    await expect(coverage).toContainText('All covered');
    await expect(coverage.locator('.live-amount')).toHaveText('€119.00');
  });

  test('keeps the page still behind an open dialog', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    await completeSetup(page);
    await openMonthly(page);
    await addBill(page, 'Electricity', '91');
    await page.evaluate(() => scrollTo(0, 200));
    const top = await page.evaluate(() => scrollY);
    expect(top).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Add bill' }).click();
    await expect(page.getByRole('dialog', { name: 'Add a bill' })).toBeVisible();
    await page.mouse.move(195, 10);
    await page.mouse.wheel(0, 400);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await page.evaluate(() => scrollY)).toBe(top);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(top);
  });

  test('fits the tabs, bills, and fixed costs on the narrowest phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await completeSetup(page);
    // Fixed costs and bills had pages of their own, and their links open the monthly page.
    await page.goto('/#bills');
    await expect(page).toHaveTitle('Monthly · Affordi');

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
    expect(labels).toEqual(Array.from({ length: 3 }, () => ({ oneLine: true, inside: true })));

    await addBill(page, 'District heating and hot water', '1234.56');
    // On the narrowest phones a bill's amount takes the line under its name.
    const name = await page
      .getByText('District heating and hot water', { exact: true })
      .boundingBox();
    const field = await page
      .getByRole('textbox', { name: 'District heating and hot water' })
      .boundingBox();
    expect(field!.y).toBeGreaterThan(name!.y + name!.height - 1);

    await addFixedCost(page, 'Home and contents insurance', '1234.56', {
      first: ['December', '1976'],
      last: ['December', '2075'],
    });
    const nav = await page.getByRole('navigation').boundingBox();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const lastRow = await page
      .getByRole('button', { name: 'Edit Home and contents insurance' })
      .boundingBox();
    expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(nav!.y);

    await page.getByRole('button', { name: 'Edit Home and contents insurance' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeInViewport();
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
