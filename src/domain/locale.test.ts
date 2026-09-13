import { describe, expect, it } from 'vitest';

import {
  currencyOptions,
  detectCurrency,
  formatCurrency,
  getCurrencySymbol,
  isCurrencyCode,
  supportedCurrencies,
} from './locale';

describe('locale and currency', () => {
  it.each([
    ['sr-RS', 'RSD'],
    ['de-DE', 'EUR'],
    ['en-US', 'USD'],
    ['ja-JP', 'JPY'],
    ['zh-CN', 'CNY'],
    ['ko-KR', 'KRW'],
    ['uk-UA', 'UAH'],
  ] as const)('detects %s as %s', (locale, currency) => {
    expect(detectCurrency(locale)).toBe(currency);
  });

  it('allows only supported currency choices and formats them', () => {
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('not-a-currency')).toBe(false);
    expect(formatCurrency(750, 'USD', 'en-US')).toBe('$750.00');
    expect(formatCurrency(1.234, 'BHD', 'en-US')).toBe('BHD\u00a01.234');
    expect(getCurrencySymbol('EUR', 'de-DE')).toBe('€');
    const commonCurrencies = new Set(['USD', 'EUR', 'GBP', 'RSD', 'CAD', 'AUD', 'CHF', 'JPY']);
    const nonFallbackCurrency = supportedCurrencies.find(
      (currency) => !commonCurrencies.has(currency),
    );
    if (nonFallbackCurrency !== undefined) expect(currencyOptions).toContain(nonFallbackCurrency);
  });
});
