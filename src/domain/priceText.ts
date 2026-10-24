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

const MS_PER_DAY = 86_400_000;
/** Within a week a weekday is clearer than a date. */
const DAYS_NAMED_BY_WEEKDAY = 6;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** When a price will have been earned: a time today or tomorrow, a weekday this week, or a date. */
export function describeEarnedBy(at: Date, now: Date, copy: Translator): string {
  // Rounding absorbs the hour a daylight saving change adds to or removes from a day.
  const days = Math.round((startOfDay(at) - startOfDay(now)) / MS_PER_DAY);
  const time = copy.time(at);
  if (days === 0) return copy.t('calculator.earnedToday', { time });
  if (days === 1) return copy.t('calculator.earnedTomorrow', { time });
  if (days <= DAYS_NAMED_BY_WEEKDAY) {
    return copy.t('calculator.earnedOn', {
      day: copy.weekday(at.getDay(), 'long'),
      time,
    });
  }
  const withYear = at.getFullYear() !== now.getFullYear();
  return copy.t('calculator.earnedDate', { date: copy.date(at, withYear) });
}
