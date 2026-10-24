import { describe, expect, it, vi } from 'vitest';

describe('language loading', () => {
  it('shows English until a language loads, then tells subscribers', async () => {
    // A fresh module, without the languages the test setup loads.
    vi.resetModules();
    const i18n = await import('./i18n');
    const onChange = vi.fn();
    const unsubscribe = i18n.subscribeToLocales(onChange);

    const before = i18n.createTranslator('de');
    expect(before.locale).toBe('en');
    expect(before.t('nav.cost')).toBe('Cost');
    expect(i18n.loadedLocaleCount()).toBe(1);

    await i18n.loadLocale('de');
    expect(i18n.createTranslator('de').t('nav.cost')).toBe('Kosten');
    expect(i18n.loadedLocaleCount()).toBe(2);
    expect(onChange).toHaveBeenCalledTimes(1);

    // English and languages already loaded need nothing more.
    await i18n.loadLocale('de');
    await i18n.loadLocale('en');
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
