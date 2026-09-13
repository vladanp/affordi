import type { IncomeSettings } from './calculations';
import { calculateHoursPerWorkday } from './calculations';
import { createTranslator, type Locale, type Translator } from './i18n';

const MINUTES_PER_HOUR = 60;
const WORKWEEK_THRESHOLD = 2;
const MAX_DISPLAYED_WORKWEEKS = 999_999;

function formatSubdayDuration(workHours: number, copy: Translator): string {
  const totalMinutes = workHours * MINUTES_PER_HOUR;
  if (totalMinutes < 1) {
    return copy.lessThanMinute();
  }

  const roundedMinutes = Math.round(totalMinutes);
  const hours = Math.floor(roundedMinutes / MINUTES_PER_HOUR);
  const minutes = roundedMinutes % MINUTES_PER_HOUR;

  return [
    ...(hours > 0 ? [copy.unit(hours, 'hour')] : []),
    ...(minutes > 0 ? [copy.unit(minutes, 'minute')] : []),
  ].join(' ');
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

  return [
    ...(workdays > 0 ? [copy.unit(workdays, 'workday')] : []),
    ...(hours > 0 ? [copy.unit(hours, 'hour')] : []),
  ].join(' ');
}

function formatWorkweekDuration(
  workHours: number,
  hoursPerWorkday: number,
  workingDaysPerWeek: number,
  copy: Translator,
): string {
  const roundedWorkdays = Math.round(workHours / hoursPerWorkday);
  const workweeks = Math.floor(roundedWorkdays / workingDaysPerWeek);
  const workdays = roundedWorkdays % workingDaysPerWeek;

  if (workweeks > MAX_DISPLAYED_WORKWEEKS) {
    return copy.moreThanWorkweeks(MAX_DISPLAYED_WORKWEEKS);
  }

  return copy.duration([
    { value: workweeks, unit: 'workweek' },
    ...(workdays > 0 ? [{ value: workdays, unit: 'day' } as const] : []),
  ]);
}

/**
 * Formats working time with at most two useful units.
 *
 * Under one workday it uses hours and minutes, under two workweeks it uses
 * workdays and hours, and from two workweeks onward it uses workweeks and days.
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

  const hoursPerWorkweek = settings.weeklyHours;
  if (workHours < hoursPerWorkweek * WORKWEEK_THRESHOLD) {
    return formatWorkdayDuration(workHours, hoursPerWorkday, copy);
  }

  return formatWorkweekDuration(workHours, hoursPerWorkday, settings.workingDaysPerWeek, copy);
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

  if (workHours < settings.weeklyHours * WORKWEEK_THRESHOLD) {
    const roundedHours = Math.max(1, Math.round(workHours));
    return copy.ofWork(copy.unit(roundedHours, 'hour'));
  }

  const secondary = formatWorkDuration(workHours, settings, language);
  return secondary === null ? null : copy.ofWork(secondary);
}
