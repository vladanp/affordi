import { formatHoursAndMinutes } from './duration';
import type { Translator } from './i18n';
import { minutesLeft, type WorkProgress } from './schedule';

const MAX_FRACTION_DIGITS = 6;
const RATE_SIGNIFICANT_DIGITS = 2;

const currencyDigits = new Map<string, number>();

/** The fraction digits a currency normally shows, which browsers may report as 0 for dinars. */
function standardDigits(currency: string, locale: string): number {
  const key = `${locale}|${currency}`;
  let digits = currencyDigits.get(key);
  if (digits === undefined) {
    digits =
      new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    currencyDigits.set(key, digits);
  }
  return digits;
}

/**
 * Fraction digits for a live total, so its last digit visibly moves several
 * times a second at the given rate, but never fewer than the currency uses.
 */
export function tickerDigits(perSecond: number, currency: string, locale: string): number {
  const standard = standardDigits(currency, locale);
  if (!Number.isFinite(perSecond) || perSecond <= 0) return standard;
  const digits = Math.ceil(-Math.log10(perSecond)) + 1;
  return Math.min(Math.max(digits, standard), MAX_FRACTION_DIGITS);
}

const fixedFormats = new Map<string, Intl.NumberFormat>();

function fixedFormat(currency: string, locale: string, digits: number): Intl.NumberFormat {
  const key = `${locale}|${currency}|${digits}`;
  let format = fixedFormats.get(key);
  if (format === undefined) {
    format = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    fixedFormats.set(key, format);
  }
  return format;
}

/** A live total split so the digits beyond the currency's usual precision can be styled apart. */
export interface TickerParts {
  lead: string;
  extra: string;
  trail: string;
}

export function formatTicker(
  value: number,
  currency: string,
  locale: string,
  digits: number,
): TickerParts {
  const standard = standardDigits(currency, locale);
  const parts: TickerParts = { lead: '', extra: '', trail: '' };
  let afterFraction = false;
  for (const part of fixedFormat(currency, locale, digits).formatToParts(value)) {
    if (part.type === 'fraction') {
      parts.lead += part.value.slice(0, standard);
      parts.extra += part.value.slice(standard);
      afterFraction = true;
    } else if (afterFraction) {
      parts.trail += part.value;
    } else if (part.type === 'decimal' && standard === 0) {
      // Without usual fraction digits, the separator belongs with the extra digits.
      parts.extra += part.value;
    } else {
      parts.lead += part.value;
    }
  }
  return parts;
}

/**
 * A rate in its currency with at least two significant digits, so tiny rates
 * stay legible, and never fewer fraction digits than the currency uses.
 */
export function formatRate(value: number, currency: string, locale: string): string {
  const standard = standardDigits(currency, locale);
  const needed = value > 0 ? RATE_SIGNIFICANT_DIGITS - 1 - Math.floor(Math.log10(value)) : standard;
  const digits = Math.min(Math.max(needed, standard), MAX_FRACTION_DIGITS);
  return fixedFormat(currency, locale, digits).format(value);
}

/** A total earned so far in the currency's usual precision, rounded down so it never runs ahead. */
export function formatEarned(value: number, currency: string, locale: string): string {
  const standard = standardDigits(currency, locale);
  const scale = 10 ** standard;
  // A small allowance keeps exact totals such as 0.29 from dropping a cent to float error.
  return fixedFormat(currency, locale, standard).format(Math.floor(value * scale + 1e-9) / scale);
}

const progressFormats = new Map<string, Intl.NumberFormat>();

/** A whole percentage rounded down, so it reads 100% only once the work is complete. */
export function formatProgress(share: number, locale: string): string {
  let format = progressFormats.get(locale);
  if (format === undefined) {
    format = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    progressFormats.set(locale, format);
  }
  // A small allowance keeps values such as 0.29 * 100 = 28.999… from dropping a point.
  return format.format(Math.floor(share * 100 + 1e-9) / 100);
}

/**
 * Where today stands in the workday, such as "Working until 5:00 PM", with
 * the time left as a separate part during work, such as "2 hours left".
 */
export function describeWorkStatus(
  progress: WorkProgress,
  copy: Translator,
): [status: string, timeLeft?: string] {
  if (progress.state === 'off') return [copy.t('earnings.dayOff')];
  if (progress.state === 'before') {
    return [copy.t('earnings.startsAt', { time: copy.time(progress.start) })];
  }
  if (progress.state === 'done') {
    return [copy.t('earnings.finishedAt', { time: copy.time(progress.end) })];
  }

  const duration = formatHoursAndMinutes(minutesLeft(progress.remainingMs), copy);
  return [
    copy.t('earnings.workingUntil', { time: copy.time(progress.end) }),
    copy.t('earnings.timeLeft', { duration }),
  ];
}
