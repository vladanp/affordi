import type { IncomeSettings } from './calculations';
import { calculateHoursPerWorkday } from './calculations';
import { createTranslator, type Locale, type Translator } from './i18n';

const MINUTES_PER_HOUR = 60;
const WEEK_THRESHOLD = 2;
const MAX_DISPLAYED_WEEKS = 999_999;

function formatSubdayDuration(workHours: number, copy: Translator): string {
  const totalMinutes = workHours * MINUTES_PER_HOUR;
  if (totalMinutes < 1) {
    return copy.lessThanMinute();
  }

  const roundedMinutes = Math.round(totalMinutes);
  const hours = Math.floor(roundedMinutes / MINUTES_PER_HOUR);
  const minutes = roundedMinutes % MINUTES_PER_HOUR;

  return copy.duration([
    ...(hours > 0 ? [copy.unit(hours, 'hour')] : []),
    ...(minutes > 0 ? [copy.unit(minutes, 'minute')] : []),
  ]);
}

function formatWorkdayDuration(
  workHours: number,
  hoursPerWorkday: number,
  copy: Translator,
): string {
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
  if (!Number.isFinite(workHours) || workHours < 0) {
    return null;
  }

  const hoursPerWorkday = calculateHoursPerWorkday(settings);
  if (hoursPerWorkday === null) {
    return null;
  }
  const copy = createTranslator(language);

  if (workHours === 0) {
    return copy.unit(0, 'minute');
  }

  if (workHours < hoursPerWorkday) {
    return formatSubdayDuration(workHours, copy);
  }

  const hoursPerWeek = settings.weeklyHours;
  if (workHours < hoursPerWeek * WEEK_THRESHOLD) {
    return formatWorkdayDuration(workHours, hoursPerWorkday, copy);
  }

  return formatWeekDuration(workHours, hoursPerWorkday, settings.workingDaysPerWeek, copy);
}

/** The headline duration: hours are the most useful unit for everyday purchases. */
export function formatPrimaryDuration(
  workHours: number,
  settings: IncomeSettings,
  language: Locale,
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
    if (workHours === 0) return copy.ofWork(copy.unit(0, 'minute'));
    return copy.ofWork(formatSubdayDuration(workHours, copy));
  }

  if (workHours < settings.weeklyHours * WEEK_THRESHOLD) {
    const roundedHours = Math.max(1, Math.round(workHours));
    return copy.ofWork(copy.unit(roundedHours, 'hour'));
  }

  const secondary = formatWorkDuration(workHours, settings, language);
  return secondary;
}
