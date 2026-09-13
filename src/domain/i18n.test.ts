import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTranslator,
  detectLocale,
  supportedLocales,
  translate,
  type TranslationKey,
} from './i18n';

describe('i18n', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the supported locale list typed and falls back to English', () => {
    expect(supportedLocales).toEqual(['en', 'de', 'fr', 'it', 'sr']);
    expect(detectLocale('pt-BR')).toBe('en');
    expect(detectLocale('sr_Latn_RS')).toBe('sr');
  });

  it('detects the first supported browser language', () => {
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['es-ES', 'de-DE', 'en-US'] });
    expect(detectLocale()).toBe('de');
  });

  it.each([
    ['en', 'Every two weeks'],
    ['de', 'Alle zwei Wochen'],
    ['fr', 'Toutes les deux semaines'],
    ['it', 'Ogni due settimane'],
    ['sr', 'Na svake dve nedelje'],
  ] as const)('translates pay frequency in %s', (locale, expected) => {
    expect(createTranslator(locale).payFrequency('biweekly')).toBe(expected);
  });

  it('handles unit grammar and compound durations', () => {
    expect(
      createTranslator('en').duration([
        { value: 1, unit: 'hour' },
        { value: 2, unit: 'minute' },
      ]),
    ).toBe('1 hour and 2 minutes');
    expect(createTranslator('de').unit(2, 'hour')).toBe('2 Stunden');
    expect(createTranslator('fr').unit(1, 'workday')).toBe('1 journée de travail');
    expect(createTranslator('it').unit(3, 'week')).toBe('3 settimane');
    expect(createTranslator('sr').unit(1, 'hour')).toBe('1 sat');
    expect(createTranslator('sr').unit(2, 'hour')).toBe('2 sata');
    expect(createTranslator('sr').unit(5, 'hour')).toBe('5 sati');
    expect(createTranslator('sr').unit(12, 'hour')).toBe('12 sati');
  });

  it('interpolates translated copy and exposes typed keys', () => {
    const key: TranslationKey = 'calculator.priceDescription';
    expect(translate('fr', key, { currency: 'EUR' })).toBe('Prix en EUR.');
    expect(
      createTranslator('sr').t('calculator.payContext', { percentage: '12,5', period: 'mesečno' }),
    ).toBe('12,5% vaše neto plate (mesečno)');
    expect(createTranslator('en').moreThanWeeks(999_999)).toBe('More than 999,999 weeks');
    expect(
      createTranslator('en').t('form.workDefaultsSummary', {
        currency: 'EUR',
        hours: 40,
        days: 5,
      }),
    ).toBe('EUR · 40 hours/week · 5 days/week');
  });
});
