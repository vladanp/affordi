import {
  calculateIncomePercentage,
  calculateWorkHours,
  paymentsPerYear,
  priceComparison,
  type PriceRepeat,
  type RecurringRepeat,
} from './calculations';
import { formatPrimaryDuration, formatSecondaryDuration, formatTotalDuration } from './duration';
import { createTranslator, type Translator } from './i18n';
import { describeEarnedBy, describePrice, formatIncomePercentage } from './priceText';
import { workDoneAt } from './schedule';
import type { AffordiSettings } from './storage';

/** Each meter segment is one pay period; long bars stop at a readable number of segments. */
const MAX_SHARE_SEGMENTS = 12;
const MONTHS_PER_YEAR = 12;
const MS_PER_HOUR = 3_600_000;

export interface ShareSegment {
  period: number;
  fill: number;
}

export interface PriceResult {
  /** The price the result is for, such as "€49.00 is", which only screen readers hear. */
  label: string;
  primary: string;
  secondary: string | null;
  /** The work time of a recurring price over its other period, or null for one payment. */
  repeatNote: string | null;
  /**
   * When a one time price will have been earned, working from now. It moves with
   * the clock, so it stays out of the spoken announcement.
   */
  earnedBy: string | null;
  share: string;
  shareMultiple: string | null;
  shareSegments: ShareSegment[];
}

function shareSegments(percentage: number): ShareSegment[] {
  const periods = percentage / 100;
  // Split only when the rounded percentage shown beside the meter is above 100%.
  const count =
    Math.round(percentage) <= 100 ? 1 : Math.min(Math.ceil(periods), MAX_SHARE_SEGMENTS);
  return Array.from({ length: count }, (_, index) => ({
    period: index + 1,
    fill: Math.min(Math.max(periods - index, 0), 1),
  }));
}

/** How many pay periods a price spans, shown from 1.1 periods so it never reads as 1.0×. */
function formatPayMultiple(percentage: number, locale: string): string | null {
  const periods = percentage / 100;
  if (Math.round(periods * 10) < 11) return null;
  const digits = periods < 10 ? 1 : 0;
  const multiple = periods.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${multiple}×`;
}

/** A recurring price over one year, or over one month for a yearly price. */
function describeRepeat(
  workHours: number,
  repeat: RecurringRepeat,
  settings: AffordiSettings,
  copy: Translator,
): string | null {
  const yearly = repeat === 'yearly';
  const hours = yearly
    ? workHours / MONTHS_PER_YEAR
    : workHours * paymentsPerYear(repeat, settings.workingDaysPerWeek);
  const duration = formatTotalDuration(hours, settings, settings.language);
  if (duration === null) return null;
  return copy.t(yearly ? 'calculator.eachMonth' : 'calculator.overYear', { duration });
}

/** Builds every piece of result copy for a valid price, or null when there is no result. */
function describeEarnedAt(
  workHours: number,
  settings: AffordiSettings,
  now: Date,
  copy: Translator,
): string | null {
  const at = workDoneAt(settings, workHours * MS_PER_HOUR, now);
  return at === null ? null : describeEarnedBy(at, now, copy);
}

export function describeResult(
  price: number | null,
  repeat: PriceRepeat,
  settings: AffordiSettings,
  now = new Date(),
): PriceResult | null {
  if (price === null) return null;
  const comparison = priceComparison(price, repeat, settings);
  const workHours = calculateWorkHours(price, settings);
  const percentage = calculateIncomePercentage(comparison.amount, settings, comparison.period);
  const primary =
    workHours === null ? null : formatPrimaryDuration(workHours, settings, settings.language);
  if (workHours === null || percentage === null || primary === null) return null;

  const copy = createTranslator(settings.language);
  return {
    label: copy.t('calculator.resultIs', {
      price: describePrice(price, repeat, settings.currency, copy),
    }),
    primary,
    secondary: formatSecondaryDuration(workHours, settings, settings.language),
    repeatNote: repeat === 'once' ? null : describeRepeat(workHours, repeat, settings, copy),
    earnedBy: repeat === 'once' ? describeEarnedAt(workHours, settings, now, copy) : null,
    share: copy.t('calculator.payContext', {
      percentage: formatIncomePercentage(percentage, settings.language),
      period: copy.payPeriod(comparison.period),
    }),
    shareMultiple: formatPayMultiple(percentage, settings.language),
    shareSegments: shareSegments(percentage),
  };
}

/** The sentence screen readers hear once the result settles. */
export function describeAnnouncement(result: PriceResult): string {
  return [
    `${result.label} ${result.primary}`,
    ...(result.secondary === null ? [] : [`≈ ${result.secondary}`]),
    ...(result.repeatNote === null ? [] : [result.repeatNote]),
    result.share,
  ].join('. ');
}
