import { expect, test } from '@playwright/test';

import { expectAccessible } from './helpers';

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

    await page.getByLabel('Nettoeinkommen').fill('3000');
    await page.getByRole('combobox', { name: 'Zahlungsrhythmus' }).selectOption('monthly');
    await page.getByLabel('Arbeitsbeginn').fill('09:00');
    await page.getByLabel('Arbeitsende').fill('17:00');
    await expect(page.getByText('8 Stunden pro Tag, 40 Stunden pro Woche')).toBeVisible();
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
    await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();

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
