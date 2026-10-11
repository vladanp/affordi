import type { PriceRepeat } from './calculations';
import type { Translator } from './i18n';
import { formatCurrency, type CurrencyCode } from './locale';

/** A price with how often it is paid, such as "€12.99 a month". One time prices stay bare. */
export function describePrice(
  price: number,
  repeat: PriceRepeat,
  currency: CurrencyCode,
  copy: Translator,
): string {
  const amount = formatCurrency(price, currency, copy.locale);
  return repeat === 'once' ? amount : copy.t(`price.${repeat}`, { price: amount });
}

/** Whole percentages read faster; anything that would round to 0% shows as under 1%. */
export function formatIncomePercentage(percentage: number, locale: string): string {
  const options = { maximumFractionDigits: 0 } as const;
  if (percentage > 0 && percentage < 0.5) {
    return `<${(1).toLocaleString(locale, options)}`;
  }
  return percentage.toLocaleString(locale, options);
}
