import { describe, expect, it } from 'vitest';

import { createTranslator, supportedLocales, translationKeys } from './i18n';

describe('translation catalog completeness', () => {
  it('provides non-empty, interpolated copy for every supported locale and key', () => {
    const values = {
      currency: 'EUR',
      price: '€10',
      percentage: 25,
      period: 'monthly',
      duration: '2 hours',
      count: 999_999,
      hours: 40,
      days: 5,
    } as const;

    for (const locale of supportedLocales) {
      const translator = createTranslator(locale);

      for (const key of translationKeys) {
        const template = translator.t(key);
        expect(template, `${locale}:${key}`).toBeTruthy();
        const copy = translator.t(key, values);
        expect(copy, `${locale}:${key} still has a placeholder`).not.toMatch(/\{\{\w+\}\}/);
      }
    }
  });

  it('translates setup, calculator, settings, errors, durations, and pay context', () => {
    const requiredKeys = [
      'app.tagline',
      'calculator.title',
      'calculator.payContext',
      'form.heading',
      'settings.title',
      'validation.income',
      'duration.lessThanMinute',
    ] as const;

    for (const locale of supportedLocales) {
      const translator = createTranslator(locale);
      for (const key of requiredKeys) {
        expect(translator.t(key, { percentage: 25, period: 'monthly' })).toBeTruthy();
      }
    }
  });
});
