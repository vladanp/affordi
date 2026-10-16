import {
  calculateIncomePercentage,
  calculateSavingMonths,
  calculateWorkHours,
  paymentsPerYear,
  priceComparison,
  trueIncomeSettings,
  type IncomeSettings,
  type PriceRepeat,
} from './calculations';
import {
  formatPrimaryDuration,
  formatSavingDuration,
  formatSecondaryDuration,
  formatTotalDuration,
} from './duration';
import { createTranslator, type Translator } from './i18n';
import { describePrice, formatIncomePercentage } from './priceText';
import type { AffordiSettings } from './storage';

/** Each meter segment is one pay period; long bars stop at a readable number of segments. */
const MAX_SHARE_SEGMENTS = 12;
const MONTHS_PER_YEAR = 12;
/** Splitting a price over one use changes nothing, so the per use line starts at two. */
const MIN_USES = 2;

export interface ShareSegment {
  period: number;
  fill: number;
}

export interface ResultNote {
  kind: 'repeat' | 'saving' | 'use';
  text: string;
}

export interface PriceResult {
  label: string;
  primary: string;
  secondary: string | null;
  notes: ResultNote[];
  /** Says the time includes commute and work costs, or null when they are not set. */
  footnote: string | null;
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

/**
 * The settings work time is measured with: the true hourly wage when commute
 * or work costs are set, otherwise the paid one. Shares of pay keep using the
 * paid income, because they describe take home pay.
 */
export function timeSettings(settings: AffordiSettings): IncomeSettings {
  return trueIncomeSettings(settings, settings) ?? settings;
}

interface NoteContext {
  copy: Translator;
  settings: AffordiSettings;
  time: IncomeSettings;
}

/** A recurring price over one year, or over one month for a yearly price. */
function repeatNote(
  workHours: number,
  repeat: Exclude<PriceRepeat, 'once'>,
  { copy, settings, time }: NoteContext,
): ResultNote | null {
  const yearly = repeat === 'yearly';
  const hours = yearly
    ? workHours / MONTHS_PER_YEAR
    : workHours * paymentsPerYear(repeat, settings.workingDaysPerWeek);
  const duration = formatTotalDuration(hours, time, settings.language);
  if (duration === null) return null;
  return {
    kind: 'repeat',
    text: copy.t(yearly ? 'calculator.eachMonth' : 'calculator.overYear', { duration }),
  };
}

function savingNote(price: number, { copy, settings }: NoteContext): ResultNote | null {
  const months = calculateSavingMonths(price, settings.monthlySavings);
  const duration = months === null ? null : formatSavingDuration(months, settings.language);
  if (duration === null) return null;
  return { kind: 'saving', text: copy.t('calculator.savingTime', { duration }) };
}

function useNote(workHours: number, uses: number, { copy, settings, time }: NoteContext) {
  if (!Number.isInteger(uses) || uses < MIN_USES) return null;
  const duration = formatTotalDuration(workHours / uses, time, settings.language);
  if (duration === null) return null;
  const count = uses.toLocaleString(settings.language);
  return { kind: 'use', text: copy.t('calculator.perUse', { count, duration }) } as const;
}

/**
 * Extra lines of context: the other period for a recurring price, or for a
 * single purchase the time to save for it and its cost per use.
 */
function describeNotes(
  price: number,
  workHours: number,
  repeat: PriceRepeat,
  uses: number,
  context: NoteContext,
): ResultNote[] {
  const notes =
    repeat === 'once'
      ? [savingNote(price, context), useNote(workHours, uses, context)]
      : [repeatNote(workHours, repeat, context)];
  return notes.filter((note) => note !== null);
}

/** Builds every piece of result copy for a valid price, or null when there is no result. */
export function describeResult(
  price: number | null,
  repeat: PriceRepeat,
  uses: number,
  settings: AffordiSettings,
): PriceResult | null {
  if (price === null) return null;
  const time = timeSettings(settings);
  const comparison = priceComparison(price, repeat, settings);
  const workHours = calculateWorkHours(price, time);
  const percentage = calculateIncomePercentage(comparison.amount, settings, comparison.period);
  const primary =
    workHours === null ? null : formatPrimaryDuration(workHours, time, settings.language);
  if (workHours === null || percentage === null || primary === null) return null;

  const copy = createTranslator(settings.language);
  return {
    label: copy.t('calculator.resultIs', {
      price: describePrice(price, repeat, settings.currency, copy),
    }),
    primary,
    secondary: formatSecondaryDuration(workHours, time, settings.language),
    notes: describeNotes(price, workHours, repeat, uses, { copy, settings, time }),
    footnote: time === settings ? null : copy.t('calculator.trueWageNote'),
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
    ...result.notes.map((note) => note.text),
    result.share,
    ...(result.footnote === null ? [] : [result.footnote]),
  ].join('. ');
}
