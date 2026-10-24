import { describe, expect, it } from 'vitest';

import { createTranslator } from './i18n';
import { describeEarnedBy, describePrice, formatIncomePercentage } from './priceText';

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

describe('describeEarnedBy', () => {
  /** Wednesday 21 October 2026 at noon. */
  const now = new Date(2026, 9, 21, 12);
  const en = createTranslator('en');

  it('names a time today or tomorrow, a weekday this week, and a date after that', () => {
    expect(describeEarnedBy(new Date(2026, 9, 21, 15, 10), now, en)).toBe(
      'Earned by 3:10 PM today',
    );
    expect(describeEarnedBy(new Date(2026, 9, 22, 9, 46), now, en)).toBe(
      'Earned by 9:46 AM tomorrow',
    );
    expect(describeEarnedBy(new Date(2026, 9, 27, 14, 32), now, en)).toBe(
      'Earned by Tuesday at 2:32 PM',
    );
    expect(describeEarnedBy(new Date(2026, 10, 9, 14, 32), now, en)).toBe('Earned by November 9');
    expect(describeEarnedBy(new Date(2027, 2, 1, 10), now, en)).toBe('Earned by March 1, 2027');
  });

  it.each([
    ['de', new Date(2026, 9, 27, 14, 32), 'Verdient bis Dienstag um 14:32'],
    ['de', new Date(2026, 10, 9), 'Verdient bis zum 9. November'],
    ['fr', new Date(2026, 9, 22, 9, 46), 'Gagné demain à 9:46'],
    ['fr', new Date(2026, 11, 1), 'Gagné le 1er décembre'],
    ['it', new Date(2026, 9, 21, 15, 10), 'Guadagnato oggi alle 15:10'],
    ['it', new Date(2027, 2, 1), 'Guadagnato il 1° marzo 2027'],
    ['sr', new Date(2026, 9, 27, 14, 32), 'Zarađeno: utorak, 14:32'],
    ['sr', new Date(2026, 10, 9), 'Zarađeno: 9. novembar'],
  ] as const)('writes %s for %s', (locale, at, expected) => {
    expect(describeEarnedBy(at, now, createTranslator(locale))).toBe(expected);
  });
});
