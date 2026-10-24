import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTranslator, detectLocale, supportedLocales, type TranslationKey } from './i18n';

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

  it.each([
    ['en', 'biweekly', '25% of your biweekly take home pay'],
    ['de', 'monthly', '25\u00a0% deines monatlichen Nettoeinkommens'],
    ['de', 'biweekly', '25\u00a0% deines zweiwöchentlichen Nettoeinkommens'],
    ['fr', 'monthly', '25\u00a0% de votre revenu net, chaque mois'],
    ['it', 'yearly', '25% del tuo stipendio netto, ogni anno'],
    ['sr', 'weekly', '25% vaše neto plate, nedeljno'],
  ] as const)('writes grammatical %s pay context for %s pay', (locale, frequency, expected) => {
    const copy = createTranslator(locale);
    const percentage = (25).toLocaleString(locale);
    expect(copy.t('calculator.payContext', { percentage, period: copy.payPeriod(frequency) })).toBe(
      expected,
    );
  });

  it('handles unit grammar and compound durations', () => {
    expect(
      createTranslator('en').duration([
        { value: 1, unit: 'hour' },
        { value: 2, unit: 'minute' },
      ]),
    ).toBe('1 hour and 2 minutes');
    expect(createTranslator('de').unit(2, 'hour')).toBe('2 Stunden');
    expect(createTranslator('fr').unit(0, 'minute')).toBe('0 minute');
    expect(createTranslator('fr').unit(1, 'workday')).toBe('1 jour');
    expect(createTranslator('it').unit(3, 'week')).toBe('3 settimane');
    expect(createTranslator('sr').unit(1, 'hour')).toBe('1 sat');
    expect(createTranslator('sr').unit(2, 'hour')).toBe('2 sata');
    expect(createTranslator('sr').unit(5, 'hour')).toBe('5 sati');
    expect(createTranslator('sr').unit(12, 'hour')).toBe('12 sati');
  });

  it.each(supportedLocales)('names weekdays in %s so each chip starts its full name', (locale) => {
    const copy = createTranslator(locale);
    for (const day of [0, 1, 2, 3, 4, 5, 6] as const) {
      const short = copy.weekday(day, 'short');
      expect(short.length).toBeGreaterThan(0);
      expect(copy.weekday(day, 'long').startsWith(short)).toBe(true);
    }
  });

  it('names weekdays by their Date.getDay() number', () => {
    expect(createTranslator('en').weekday(0, 'long')).toBe('Sunday');
    expect(createTranslator('de').weekday(1, 'long')).toBe('Montag');
    expect(createTranslator('sr').weekday(4, 'short')).toBe('čet');
  });

  it('formats clock times for the interface language', () => {
    const evening = new Date(2026, 9, 21, 17, 30);
    expect(createTranslator('en').time(evening)).toBe('5:30 PM');
    expect(createTranslator('de').time(evening)).toBe('17:30');
    expect(createTranslator('sr').time(evening)).toBe('17:30');
  });

  it('interpolates translated copy and exposes typed keys', () => {
    const key: TranslationKey = 'calculator.priceDescription';
    expect(createTranslator('fr').t(key, { currency: 'EUR' })).toBe('Prix en EUR.');
    expect(
      createTranslator('sr').t('calculator.payContext', { percentage: '12,5', period: 'mesečno' }),
    ).toBe('12,5% vaše neto plate, mesečno');
    expect(createTranslator('en').moreThanWeeks(999_999)).toBe('More than 999,999 weeks');
  });
});
