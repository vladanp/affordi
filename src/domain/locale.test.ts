import { describe, expect, it } from 'vitest';

import {
  currencyOptions,
  detectCurrency,
  formatCurrency,
  getCurrencySymbol,
  isCurrencyCode,
} from './locale';

describe('locale and currency', () => {
  it.each([
    ['sr-RS', 'RSD'],
    ['de-DE', 'EUR'],
    ['en-US', 'USD'],
    ['ja-JP', 'USD'],
  ] as const)('detects %s as %s', (locale, currency) => {
    expect(detectCurrency(locale)).toBe(currency);
  });

  it('allows only the three product currencies and formats them', () => {
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('RSD')).toBe(true);
    expect(isCurrencyCode('GBP')).toBe(false);
    expect(isCurrencyCode('not-a-currency')).toBe(false);
    expect(formatCurrency(750, 'USD', 'en-US')).toBe('$750.00');
    expect(getCurrencySymbol('EUR', 'de-DE')).toBe('€');
    expect(currencyOptions).toEqual(['EUR', 'USD', 'RSD']);
  });

  it('falls back to the currency code when a locale cannot format currency', () => {
    expect(getCurrencySymbol('RSD', 'not a locale')).toBe('RSD');
    expect(formatCurrency(12.5, 'EUR', 'not a locale')).toBe('EUR 12.50');
    expect(formatCurrency(12.5, 'EUR', 'not a locale')).toBe('EUR 12.50');
  });
});
