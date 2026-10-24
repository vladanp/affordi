import type { IncomeSettings } from './calculations';
import { calculateHoursPerWorkday } from './calculations';
import { createTranslator, type Locale, type Translator } from './i18n';

const MINUTES_PER_HOUR = 60;
const WEEK_THRESHOLD = 2;
const MAX_DISPLAYED_WEEKS = 999_999;

interface DurationContext {
  copy: Translator;
  hoursPerWorkday: number;
}

function formatSubdayDuration(workHours: number, copy: Translator): string {
  if (workHours === 0) {
    return copy.unit(0, 'minute');
  }

  const totalMinutes = workHours * MINUTES_PER_HOUR;
  if (totalMinutes < 1) {
    return copy.lessThanMinute();
  }

  return formatHoursAndMinutes(Math.round(totalMinutes), copy);
}

/** A whole number of minutes as hours and minutes, such as "7 hours and 30 minutes". */
export function formatHoursAndMinutes(totalMinutes: number, copy: Translator): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  return copy.duration([
    ...(hours > 0 ? [copy.unit(hours, 'hour')] : []),
    ...(minutes > 0 || hours === 0 ? [copy.unit(minutes, 'minute')] : []),
  ]);
}

function formatWorkdayDuration(workHours: number, { copy, hoursPerWorkday }: DurationContext) {
  let workdays = Math.floor(workHours / hoursPerWorkday);
  let hours = Math.round(workHours - workdays * hoursPerWorkday);

  if (hours >= hoursPerWorkday) {
    workdays += 1;
    hours = 0;
  }

  return copy.duration([
    ...(workdays > 0 ? [copy.unit(workdays, 'workday')] : []),
    ...(hours > 0 ? [copy.unit(hours, 'hour')] : []),
  ]);
}

function formatWholeHours(workHours: number, { copy }: DurationContext): string {
  return copy.unit(Math.max(1, Math.round(workHours)), 'hour');
}

function formatWeekDuration(
  workHours: number,
  hoursPerWorkday: number,
  workingDaysPerWeek: number,
  copy: Translator,
): string {
  const roundedWorkdays = Math.round(workHours / hoursPerWorkday);
  const weeks = Math.floor(roundedWorkdays / workingDaysPerWeek);
  const workdays = roundedWorkdays % workingDaysPerWeek;

  if (weeks > MAX_DISPLAYED_WEEKS) {
    return copy.moreThanWeeks(MAX_DISPLAYED_WEEKS);
  }

  return copy.duration([
    { value: weeks, unit: 'week' },
    ...(workdays > 0 ? [{ value: workdays, unit: 'workday' } as const] : []),
  ]);
}

/**
 * Shared shape of the duration formatters: hours and minutes under one workday,
 * the given format under two weeks, and weeks and days from two weeks onward.
 */
function formatDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
  formatUnderTwoWeeks: (workHours: number, context: DurationContext) => string,
): string | null {
  if (!Number.isFinite(workHours) || workHours < 0) {
    return null;
  }

  const hoursPerWorkday = calculateHoursPerWorkday(settings);
  if (hoursPerWorkday === null) {
    return null;
  }
  const copy = createTranslator(language);

  if (workHours < hoursPerWorkday) {
    return formatSubdayDuration(workHours, copy);
  }

  if (workHours < settings.weeklyHours * WEEK_THRESHOLD) {
    return formatUnderTwoWeeks(workHours, { copy, hoursPerWorkday });
  }

  return formatWeekDuration(workHours, hoursPerWorkday, settings.workingDaysPerWeek, copy);
}

/**
 * Formats working time with at most two useful units.
 *
 * Under one day it uses hours and minutes, under two weeks it uses days and
 * hours, and from two weeks onward it uses weeks and days.
 */
export function formatWorkDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
): string | null {
  return formatDuration(workHours, settings, language, formatWorkdayDuration);
}

/** A duration in the headline units: like `formatWorkDuration`, but whole hours under two weeks. */
export function formatTotalDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
): string | null {
  return formatDuration(workHours, settings, language, formatWholeHours);
}

/** The headline duration: hours are the most useful unit for everyday purchases. */
export function formatPrimaryDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
): string | null {
  const total = formatTotalDuration(workHours, settings, language);
  if (total === null || workHours >= settings.weeklyHours * WEEK_THRESHOLD) {
    return total;
  }
  return createTranslator(language).ofWork(total);
}

/**
 * Supporting context that never repeats the headline unit: days and hours
 * beside an hour headline, and total hours beside a week headline. Durations
 * under one workday need no extra context.
 */
export function formatSecondaryDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
): string | null {
  const hoursPerWorkday = calculateHoursPerWorkday(settings);
  if (!Number.isFinite(workHours) || hoursPerWorkday === null || workHours < hoursPerWorkday) {
    return null;
  }

  if (workHours < settings.weeklyHours * WEEK_THRESHOLD) {
    return formatWorkDuration(workHours, settings, language);
  }

  const roundedHours = Math.round(workHours);
  if (roundedHours / settings.weeklyHours > MAX_DISPLAYED_WEEKS) return null;
  return createTranslator(language).unit(roundedHours, 'hour');
}
