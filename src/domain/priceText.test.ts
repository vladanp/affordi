import { describe, expect, it } from 'vitest';

import { createTranslator } from './i18n';
import { describePrice, formatIncomePercentage } from './priceText';

describe('describePrice', () => {
  it.each([
    ['en', 'once', '€4.50'],
    ['en', 'workday', '€4.50 every workday'],
    ['en', 'weekly', '€4.50 a week'],
    ['de', 'workday', '4,50 € pro Arbeitstag'],
    ['de', 'monthly', '4,50 € pro Monat'],
    ['fr', 'weekly', '4,50 € par semaine'],
    ['it', 'yearly', '4,50 € all’anno'],
    ['sr', 'workday', '4,50 € po radnom danu'],
  ] as const)('writes a %s price paid %s', (locale, repeat, expected) => {
    expect(describePrice(4.5, repeat, 'EUR', createTranslator(locale))).toBe(expected);
  });

  it('builds grammatical result labels around the price phrase', () => {
    const german = createTranslator('de');
    expect(
      german.t('calculator.resultIs', { price: describePrice(12.99, 'monthly', 'EUR', german) }),
    ).toBe('12,99 € pro Monat entspricht');
    const italian = createTranslator('it');
    expect(
      italian.t('calculator.resultIs', { price: describePrice(4.5, 'weekly', 'EUR', italian) }),
    ).toBe('4,50 € a settimana equivale a');
  });
});

describe('formatIncomePercentage', () => {
  it('rounds to whole percentages and marks tiny shares', () => {
    expect(formatIncomePercentage(0.2, 'en')).toBe('<1');
    expect(formatIncomePercentage(0, 'en')).toBe('0');
    expect(formatIncomePercentage(1_234.4, 'de')).toBe('1.234');
  });
});
