import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.getByRole('textbox', { name: 'Nettoeinkommen' }).fill('3000');
    await page.getByRole('combobox', { name: 'Zahlungsrhythmus' }).selectOption('monthly');
    await page.getByRole('textbox', { name: 'Arbeitsstunden pro Woche' }).fill('40');
    await page.getByRole('textbox', { name: 'Arbeitstage pro Woche' }).fill('5');
    await page.getByRole('combobox', { name: 'Währung' }).selectOption('EUR');
    await page.getByRole('button', { name: 'Berechnung starten' }).click();

    await expect(page.getByRole('heading', { name: 'Was kostet es an Zeit?' })).toBeVisible();
    await page.getByRole('button', { name: 'Einstellungen' }).click();

    const language = page.getByRole('combobox', { name: /Sprache|Language/ });
    const theme = page.getByRole('combobox', { name: /Darstellung|Thema|Theme/ });
    await expect(language).toBeVisible();
    await expect(theme).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await theme.selectOption('dark');
    await language.selectOption('fr');
    await page
      .getByRole('button', { name: /Enregistrer les réglages|Einstellungen speichern/ })
      .click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: /Combien cela coûte-t-il/ })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: /Combien cela coûte-t-il/ })).toBeVisible();
  });
});
