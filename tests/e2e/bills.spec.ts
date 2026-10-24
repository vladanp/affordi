import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { completeSetup } from './helpers';

test.use({ timezoneId: 'UTC' });

async function expectAccessible(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
}

async function addBill(page: Page, name: string, amount: string) {
  await page.getByRole('button', { name: 'Add bill' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a bill' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Amount' }).fill(amount);
  await dialog.getByRole('button', { name: 'Add bill' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Affordi bills', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('adds monthly amounts, averages them, and keeps them after a reload', async ({ page }) => {
    await completeSetup(page);
    await page.getByRole('link', { name: 'Bills', exact: true }).click();
    await expect(page).toHaveURL(/#bills$/);
    await expect(page).toHaveTitle('Bills · Affordi');
    await expect(page.getByRole('heading', { name: 'What do your bills cost?' })).toBeVisible();

    await addBill(page, 'Electricity', '91');
    await addBill(page, 'Water', '34');
    await page.getByRole('button', { name: 'Edit Electricity' }).click();
    const edit = page.getByRole('dialog', { name: 'Electricity' });
    await edit.getByRole('combobox', { name: 'Month' }).selectOption({ label: 'September 2026' });
    await edit.getByRole('textbox', { name: 'Amount' }).fill('79');
    await edit.getByRole('button', { name: 'Save' }).click();
    await expect(edit).toBeHidden();

    // Electricity averages €85 over two months and water €34 over one.
    const average = page.locator('.stat-card', { hasText: 'Bills in an average month' });
    await expect(average).toContainText('€119.00');
    await expect(average).toContainText('6 hours and 53 minutes of work');
    await expect(average).toContainText('4% of your monthly take home pay');
    await expect(page.locator('.stat-card', { hasText: 'Left after' })).toContainText('€2,881.00');
    await expect(page.getByRole('list', { name: 'Your bills' }).getByRole('listitem')).toHaveText([
      /^Electricity€85\.00.*October: €91\.00 · 7% above average$/,
      /^Water€34\.00.*October: €34\.00$/,
    ]);

    const chart = page.getByRole('group', { name: 'Bills per month' });
    await expect(page.locator('.bills-readout')).toHaveText('October 2026: €125.00');
    await chart.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.bills-readout')).toHaveText('September 2026: €79.00');
    await page.keyboard.press('Home');
    await expect(page.locator('.bills-readout')).toHaveText('November 2025: no amounts');
    await expectAccessible(page);

    await page.reload();
    await page.getByRole('button', { name: 'Edit Electricity' }).click();
    await expect(edit.getByText('Saved for this month: €91.00.')).toBeVisible();
    await expect(edit.getByRole('list').getByRole('listitem')).toHaveCount(2);
    await expectAccessible(page);
    await edit.getByRole('button', { name: 'Remove September 2026' }).click();
    await edit.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: 'Edit Electricity' })).toBeFocused();
    await expect(average).toContainText('€125.00');

    await page.getByRole('link', { name: 'Earnings' }).click();
    // By noon on 21 October the month's pay has covered this month's bills.
    const coverage = page.locator('.earnings-fixed-costs');
    await expect(coverage).toContainText('Fixed costs and bills this month');
    await expect(coverage).toContainText('All covered');
    await expect(coverage.locator('.live-amount')).toHaveText('€125.00');
  });

  test('keeps the page clear of the tab bar on the narrowest phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await completeSetup(page);
    await page.getByRole('link', { name: 'Bills', exact: true }).click();
    await addBill(page, 'District heating and hot water', '1234.56');
    await addBill(page, 'Water', '34');

    const nav = await page.getByRole('navigation').boundingBox();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const lastRow = await page.getByRole('button', { name: 'Edit Water' }).boundingBox();
    expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(nav!.y);

    await page.getByRole('button', { name: 'Edit District heating and hot water' }).click();
    await expect(page.getByRole('button', { name: 'Save' })).toBeInViewport();
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
