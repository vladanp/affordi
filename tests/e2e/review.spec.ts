import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { completeSetup, waitForStillness } from './helpers';

test.use({ timezoneId: 'UTC', reducedMotion: 'reduce' });
async function monthly(page: Page) {
  await page.getByRole('link', { name: 'Monthly', exact: true }).click();
}
async function addCost(page: Page, name: string, amount: string) {
  await page.getByRole('button', { name: 'Add fixed cost', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel('Amount each month').fill(amount);
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
}

test('keeps numeric meaning and validation language when preferences change', async ({ page }) => {
  await completeSetup(page);
  await page.locator('#item-price').fill('1,000');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Take home income').fill('3,000');
  await page.locator('#language').selectOption('de');
  await expect(page.locator('#netIncome')).toHaveValue('3000');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.locator('#item-price')).toHaveValue('1000');
  await expect(page.locator('.result-primary')).toContainText('58');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.netIncome,
    ),
  ).toBe(3000);
});

test('merges simultaneous additions from two open tabs and propagates reset', async ({
  page,
  context,
}) => {
  await completeSetup(page);
  await monthly(page);
  const second = await context.newPage();
  await second.goto('/#monthly');
  // Hold both edit forms open before either write, so neither sees the other tab’s additions yet.
  await Promise.all(
    (
      [
        [page, 'Rent', '950'],
        [second, 'Phone', '20'],
      ] as const
    ).map(async ([tab, name, amount]) => {
      await tab.getByRole('button', { name: 'Add fixed cost', exact: true }).click();
      await tab.getByRole('dialog').getByLabel('Name', { exact: true }).fill(name);
      await tab.getByRole('dialog').getByLabel('Amount each month').fill(amount);
    }),
  );
  await Promise.all(
    [page, second].map((tab) =>
      tab.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click(),
    ),
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('affordi.fixedCosts.v1')!)
          .fixedCosts.map((c: { name: string }) => c.name)
          .toSorted(),
      ),
    )
    .toEqual(['Phone', 'Rent']);
  await expect(second.getByRole('button', { name: 'Edit Rent', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset saved settings' }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(second.getByRole('button', { name: 'Start calculating' })).toBeVisible();
});

test('merges open dialog drafts with other-tab edits and respects deletion', async ({
  page,
  context,
}) => {
  await completeSetup(page);
  await monthly(page);
  await addCost(page, 'Rent', '950');
  await page.getByRole('button', { name: 'Add bill', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Power');
  await page.getByRole('dialog').getByLabel('Amount', { exact: true }).fill('100');
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await context.newPage();
  await second.goto('/#monthly');

  await page.getByRole('button', { name: 'Edit Rent', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Home');
  await second.getByRole('button', { name: 'Edit Rent', exact: true }).click();
  await second.getByRole('dialog').getByLabel('Amount each month').fill('1000');
  await second.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.fixed-costs .item-amount')).toHaveText('€1,000.00');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('affordi.fixedCosts.v1')!).fixedCosts[0]),
    )
    .toMatchObject({ name: 'Home', amount: 1000 });

  await page.getByRole('button', { name: 'Edit Power', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Electricity');
  await second.getByRole('textbox', { name: 'Power', exact: true }).fill('200');
  await expect(page.locator('.bill-row-input input')).toHaveValue('200.00');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('affordi.bills.v1')!).bills[0]))
    .toMatchObject({ name: 'Electricity', entries: [{ amount: 200 }] });

  await page.getByRole('button', { name: 'Edit Home', exact: true }).click();
  await second.getByRole('button', { name: 'Edit Home', exact: true }).click();
  await second.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await second.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.fixed-costs .item')).toHaveCount(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('affordi.fixedCosts.v1')!).fixedCosts,
    ),
  ).toEqual([]);
});

test('persists an inline zero before blur and reload', async ({ page }) => {
  await completeSetup(page);
  await monthly(page);
  await page.getByRole('button', { name: 'Add bill', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Power');
  await page.getByRole('dialog').getByLabel('Amount', { exact: true }).fill('100');
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Power', exact: true }).fill('0');
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('affordi.bills.v1')!).bills[0].entries[0].amount,
      ),
    )
    .toBe(0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Power', exact: true })).toHaveValue('0.00');
  await expect(page.locator('.bill-month-total')).toHaveText('Total €0.00');
});

test('backs up and reviews replacement data entirely on the device', async ({ page }) => {
  await completeSetup(page);
  await monthly(page);
  await addCost(page, 'Rent', '950');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'On this device', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloading;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(backup.fixedCosts[0].name).toBe('Rent');
  backup.settings.netIncome = 5000;
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole('heading', { name: 'Replace saved data?' })).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.netIncome,
    ),
  ).toBe(3000);
  await page.getByRole('button', { name: 'Replace data', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.netIncome,
      ),
    )
    .toBe(5000);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('requires an explicit currency denomination change', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('radio', { name: 'RSD', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.currency,
    ),
  ).toBe('EUR');
  await expect(page.getByText(/Numbers stay the same/)).toBeVisible();
  await page.getByRole('button', { name: 'Change denomination', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.currency,
      ),
    )
    .toBe('RSD');
});

test('keeps result, masking, and page navigation reading positions steady', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await completeSetup(page);
  const price = page.locator('#item-price');
  await price.fill('1400');
  await waitForStillness(page);
  const before = (await page.locator('.result-share').boundingBox())!.y;
  await price.fill('9999');
  await waitForStillness(page);
  expect(Math.abs((await page.locator('.result-share').boundingBox())!.y - before)).toBeLessThan(2);
  await monthly(page);
  await addCost(page, 'Rent', '950');
  await page.getByRole('button', { name: 'Add bill', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Power');
  await page.getByRole('dialog').getByLabel('Amount', { exact: true }).fill('100');
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await waitForStillness(page);
  const heading = page.locator('.fixed-costs .list-heading');
  await page.evaluate(() => scrollTo(0, 0));
  const top = (await heading.boundingBox())!.y;
  const rowHeight = (await page.locator('.bill-row').boundingBox())!.height;
  await page.getByRole('button', { name: 'Hide amounts', exact: true }).click();
  expect(Math.abs((await heading.boundingBox())!.y - top)).toBeLessThan(2);
  expect(
    Math.abs((await page.locator('.bill-row').boundingBox())!.height - rowHeight),
  ).toBeLessThan(2);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.getByRole('link', { name: 'Earnings', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('#earnings-title')).toBeInViewport();
});

test('shows a stable shell while a non-English locale request is delayed', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'languages', { value: ['de-DE'] }),
  );
  await page.route('**/assets/de-*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status', { name: 'Affordi', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Preise in Arbeitszeit umrechnen' }),
  ).toBeVisible();
});
