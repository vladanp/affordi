import { expect, test } from '@playwright/test';

import { completeSetup, expectAccessible } from './helpers';

test('preserves income, a typed price, and bill amounts across languages', async ({ page }) => {
  await completeSetup(page);
  await page.getByRole('textbox', { name: 'How much does it cost?' }).fill('1,234.56');
  await page.getByRole('link', { name: 'Monthly' }).click();
  await page.getByRole('button', { name: 'Add bill' }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Water');
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('34.125');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Take home income').fill('3,000.125');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
  await expect(page.getByRole('textbox', { name: 'Nettoeinkommen', exact: true })).toHaveValue(
    '3000,125',
  );
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  const water = page.getByRole('textbox', { name: 'Water', exact: true });
  await expect(water).toHaveValue('34,125');
  await water.focus();
  await water.press('Tab');
  await expect(page.locator('.bill-month-total')).toContainText('34,13');
  await page.getByRole('link', { name: 'Kosten', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Was kostet es an Zeit?' })).toHaveValue(
    '1234,56',
  );
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await expect(page.getByRole('textbox', { name: 'Nettoeinkommen', exact: true })).toHaveValue(
    '3000,125',
  );
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  expect(
    await page.evaluate(() => ({
      income: JSON.parse(localStorage.getItem('affordi.settings.v1')!).settings.netIncome,
      bill: JSON.parse(localStorage.getItem('affordi.bills.v1')!).bills[0].entries[0].amount,
    })),
  ).toEqual({ income: 3000.125, bill: 34.125 });
  await expectAccessible(page);
});

test.describe('localization and theme preferences', () => {
  test.use({ locale: 'de-DE', colorScheme: 'light' });

  test('detects the browser language, changes language and theme, and reloads with both saved', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page).toHaveTitle(/Affordi/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('heading', { name: 'Beginne mit deinem Einkommen' })).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('textbox', { name: 'Nettoeinkommen', exact: true }).fill('3000');
    await page.getByRole('combobox', { name: 'Zahlungsrhythmus' }).selectOption('monthly');
    await page.getByLabel('Arbeitsbeginn').fill('09:00');
    await page.getByLabel('Arbeitsende').fill('17:00');
    await page.getByRole('radio', { name: 'EUR' }).check();
    await page.getByRole('button', { name: 'Berechnung starten' }).click();

    await expect(page.getByRole('heading', { name: 'Was kostet es an Zeit?' })).toBeVisible();
    await page.getByRole('button', { name: 'Einstellungen' }).click();

    const language = page.getByRole('combobox', { name: 'Sprache' });
    await expect(language).toBeVisible();
    await expect(page.getByRole('group', { name: 'Darstellung' })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('radio', { name: 'Dunkel' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await language.selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: /Quel est son coût en temps/ })).toBeVisible();
    await expectAccessible(page);

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: /Quel est son coût en temps/ })).toBeVisible();
  });
});
