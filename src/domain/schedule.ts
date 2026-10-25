import { isWorkingDayCount, MAX_HOURS_PER_WORKDAY, MAX_WEEKLY_HOURS } from './calculations';

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
/** Work done later than this many weeks from now is too far ahead to name a date for. */
const MAX_WORK_WEEKS_AHEAD = 52 * 100;
/** Enough days to finish the under two weeks of work left after whole weeks are skipped. */
const MAX_DAYS_TO_WALK = 22;
/** Older saves only knew weekly hours, so their workday is placed from 9:00. */
const LEGACY_WORK_START = 9 * MINUTES_PER_HOUR;

/** Weekdays as `Date.getDay()` numbers in the order they are shown, Monday first. */
export const weekdays = [1, 2, 3, 4, 5, 6, 0] as const;

export type Weekday = (typeof weekdays)[number];

/** When work happens. A workday starts and ends on the same calendar day. */
export interface WorkSchedule {
  /** Minutes after midnight when work starts. */
  workStart: number;
  /** Minutes after midnight when work ends, where 1440 is the midnight that ends the day. */
  workEnd: number;
  /** Work days as `Date.getDay()` numbers in ascending order, 0 for Sunday. */
  workDays: readonly Weekday[];
}

function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'number' && weekdays.some((day) => day === value);
}

function isMinuteOfDay(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** At least one work day, in ascending order without duplicates. */
function isWorkDayList(value: unknown): value is Weekday[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  let previous = -1;
  for (const day of value as unknown[]) {
    if (!isWeekday(day) || day <= previous) return false;
    previous = day;
  }
  return true;
}

export function isWorkSchedule(value: unknown): value is WorkSchedule {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('workStart' in value) ||
    !('workEnd' in value) ||
    !('workDays' in value)
  ) {
    return false;
  }

  return (
    isMinuteOfDay(value.workStart, 0, MINUTES_PER_DAY - 1) &&
    isMinuteOfDay(value.workEnd, 1, MINUTES_PER_DAY) &&
    value.workEnd > value.workStart &&
    isWorkDayList(value.workDays)
  );
}

/** Weekly hours and work days implied by a schedule, as the calculations use them. */
export function scheduleHours(schedule: WorkSchedule): {
  weeklyHours: number;
  workingDaysPerWeek: number;
} {
  const workingDaysPerWeek = schedule.workDays.length;
  const dailyMinutes = schedule.workEnd - schedule.workStart;
  return {
    weeklyHours: (dailyMinutes * workingDaysPerWeek) / MINUTES_PER_HOUR,
    workingDaysPerWeek,
  };
}

/**
 * Builds a schedule for saves from before work times existed: the first work
 * days of the week, from 9:00, or earlier when a long day would pass midnight.
 */
export function scheduleFromWeeklyHours(
  weeklyHours: unknown,
  workingDaysPerWeek: unknown,
): WorkSchedule | null {
  if (
    typeof weeklyHours !== 'number' ||
    !Number.isFinite(weeklyHours) ||
    weeklyHours <= 0 ||
    weeklyHours > MAX_WEEKLY_HOURS ||
    !isWorkingDayCount(workingDaysPerWeek) ||
    weeklyHours > workingDaysPerWeek * MAX_HOURS_PER_WORKDAY
  ) {
    return null;
  }

  const dailyMinutes = Math.max(
    1,
    Math.round((weeklyHours / workingDaysPerWeek) * MINUTES_PER_HOUR),
  );
  const workStart = Math.min(LEGACY_WORK_START, MINUTES_PER_DAY - dailyMinutes);
  return {
    workStart,
    workEnd: workStart + dailyMinutes,
    workDays: weekdays.slice(0, workingDaysPerWeek).toSorted((first, second) => first - second),
  };
}

/**
 * Reads the value of a time field, such as `09:30`. An end of `00:00` means
 * the midnight that ends the day, because a workday cannot end before it starts.
 */
export function parseTimeInput(value: string, role: 'start' | 'end'): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());
  if (match === null) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const total = hours * MINUTES_PER_HOUR + minutes;
  return role === 'end' && total === 0 ? MINUTES_PER_DAY : total;
}

/** The `HH:MM` value of a time field for minutes after midnight. */
export function timeInputValue(minutes: number): string {
  const minuteOfDay = minutes % MINUTES_PER_DAY;
  const hours = Math.floor(minuteOfDay / MINUTES_PER_HOUR);
  return `${String(hours).padStart(2, '0')}:${String(minuteOfDay % MINUTES_PER_HOUR).padStart(2, '0')}`;
}

export type WorkState = 'off' | 'before' | 'working' | 'done';

export interface WorkProgress {
  state: WorkState;
  /** Time worked so far today. */
  workedMs: number;
  /** Time left in today's workday, zero outside it. */
  remainingMs: number;
  /** Today's start and end, for display. */
  start: Date;
  end: Date;
}

/** The local time on the same calendar day as `now`, `minutes` after midnight. */
function sameDayAt(now: Date, minutes: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, minutes);
}

/** Where `now` falls in today's workday. */
export function workProgress(schedule: WorkSchedule, now: Date): WorkProgress {
  const start = sameDayAt(now, schedule.workStart);
  const end = sameDayAt(now, schedule.workEnd);
  const time = now.getTime();
  const isWorkDay = schedule.workDays.some((day) => day === now.getDay());

  if (!isWorkDay) return { state: 'off', workedMs: 0, remainingMs: 0, start, end };
  if (time < start.getTime()) return { state: 'before', workedMs: 0, remainingMs: 0, start, end };
  if (time >= end.getTime()) {
    return { state: 'done', workedMs: end.getTime() - start.getTime(), remainingMs: 0, start, end };
  }
  return {
    state: 'working',
    workedMs: time - start.getTime(),
    remainingMs: end.getTime() - time,
    start,
    end,
  };
}

export interface MonthWorkProgress {
  /** Time worked so far this calendar month. */
  workedMs: number;
  /** All work time scheduled this calendar month. */
  scheduledMs: number;
}

/** Work done so far this calendar month against all the work scheduled in it. */
export function monthWorkProgress(schedule: WorkSchedule, now: Date): MonthWorkProgress {
  const workDays = new Set<number>(schedule.workDays);
  const time = now.getTime();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const progress: MonthWorkProgress = { workedMs: 0, scheduledMs: 0 };

  for (let date = 1; date <= daysInMonth; date += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), date);
    if (!workDays.has(day.getDay())) continue;

    const start = sameDayAt(day, schedule.workStart).getTime();
    const end = sameDayAt(day, schedule.workEnd).getTime();
    progress.scheduledMs += end - start;
    progress.workedMs += Math.min(Math.max(time - start, 0), end - start);
  }
  return progress;
}

/**
 * When `workMs` of work, counted from `now` through the schedule, will be done.
 * Every whole week holds the same work, so all but the last are skipped at once.
 * Returns null for no work or for work too far ahead to name a date for.
 */
export function workDoneAt(schedule: WorkSchedule, workMs: number, now: Date): Date | null {
  if (!Number.isFinite(workMs) || workMs <= 0) return null;

  const workDays = new Set<number>(schedule.workDays);
  const weekMs = (schedule.workEnd - schedule.workStart) * MS_PER_MINUTE * workDays.size;
  const skippedWeeks = Math.max(0, Math.floor(workMs / weekMs) - 1);
  if (skippedWeeks > MAX_WORK_WEEKS_AHEAD) return null;

  let remaining = workMs - skippedWeeks * weekMs;
  const from = new Date(now);
  from.setDate(from.getDate() + skippedWeeks * 7);
  for (let offset = 0; offset < MAX_DAYS_TO_WALK; offset += 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    if (!workDays.has(day.getDay())) continue;

    const start = Math.max(sameDayAt(day, schedule.workStart).getTime(), from.getTime());
    const end = sameDayAt(day, schedule.workEnd).getTime();
    if (end <= start) continue;
    if (end - start >= remaining) return new Date(start + remaining);
    remaining -= end - start;
  }
  return null;
}

/** Whole minutes left, rounded up so the last seconds still read as one minute. */
export function minutesLeft(remainingMs: number): number {
  return Math.ceil(remainingMs / MS_PER_MINUTE);
}

/** Milliseconds since local midnight. */
export function msSinceMidnight(now: Date): number {
  return now.getTime() - sameDayAt(now, 0).getTime();
}
