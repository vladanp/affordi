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

/** When work happens. Overnight shifts belong to the weekday they start on. */
export interface WorkSchedule {
  /** Minutes after midnight when work starts. */
  workStart: number;
  /** Minutes after midnight when work ends, where 1440 is the midnight that ends the day. */
  workEnd: number;
  /** Work days as `Date.getDay()` numbers in ascending order, 0 for Sunday. */
  workDays: readonly Weekday[];
  /** Unpaid minutes, distributed proportionally through the shift for live estimates. */
  workBreak?: number;
  /** Overrides for selected weekdays, each attributed to the day the shift starts. */
  workSessions?: readonly DaySession[];
}

export interface DaySession {
  day: Weekday;
  workStart: number;
  workEnd: number;
  workBreak: number;
}

function shiftMinutes(start: number, end: number): number {
  return end > start ? end - start : end + MINUTES_PER_DAY - start;
}

function validShift(start: unknown, end: unknown, unpaid: unknown): boolean {
  return (
    isMinuteOfDay(start, 0, 1439) &&
    isMinuteOfDay(end, 1, 1440) &&
    start !== end &&
    typeof unpaid === 'number' &&
    Number.isInteger(unpaid) &&
    unpaid >= 0 &&
    unpaid < shiftMinutes(start, end)
  );
}

function sessions(schedule: WorkSchedule): DaySession[] {
  return schedule.workDays.map(
    (day) =>
      schedule.workSessions?.find((session) => session.day === day) ?? {
        day,
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        workBreak: schedule.workBreak ?? 0,
      },
  );
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

function readSession(session: unknown): DaySession | null {
  if (
    typeof session !== 'object' ||
    session === null ||
    !('day' in session) ||
    !isWeekday(session.day) ||
    !('workStart' in session) ||
    !('workEnd' in session) ||
    !('workBreak' in session) ||
    !isMinuteOfDay(session.workStart, 0, 1439) ||
    !isMinuteOfDay(session.workEnd, 1, 1440) ||
    typeof session.workBreak !== 'number' ||
    !validShift(session.workStart, session.workEnd, session.workBreak)
  )
    return null;
  return {
    day: session.day,
    workStart: session.workStart,
    workEnd: session.workEnd,
    workBreak: session.workBreak,
  };
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

  if (
    !validShift(value.workStart, value.workEnd, 'workBreak' in value ? value.workBreak : 0) ||
    !isWorkDayList(value.workDays)
  )
    return false;
  if (!('workSessions' in value) || value.workSessions === undefined) return true;
  if (!Array.isArray(value.workSessions) || value.workSessions.length !== value.workDays.length)
    return false;
  const days = new Set<unknown>();
  const selected = new Set<number>(value.workDays);
  const shifts: DaySession[] = [];
  for (const entry of value.workSessions as unknown[]) {
    const session = readSession(entry);
    if (session === null || !selected.has(session.day) || days.has(session.day)) return false;
    days.add(session.day);
    shifts.push(session);
  }
  return shifts.every((shift) => {
    if (shift.workEnd > shift.workStart) return true;
    const following = shifts.find((item) => item.day === (shift.day + 1) % 7);
    return following === undefined || following.workStart >= shift.workEnd;
  });
}

/** Weekly hours and work days implied by a schedule, as the calculations use them. */
export function scheduleHours(schedule: WorkSchedule): {
  weeklyHours: number;
  workingDaysPerWeek: number;
} {
  const workingDaysPerWeek = schedule.workDays.length;
  const paidMinutes = sessions(schedule).reduce(
    (sum, session) => sum + shiftMinutes(session.workStart, session.workEnd) - session.workBreak,
    0,
  );
  return {
    weeklyHours: paidMinutes / MINUTES_PER_HOUR,
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
 * the midnight that ends the start day. An earlier end time continues into the next day.
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

interface Shift {
  start: Date;
  end: Date;
  paidFraction: number;
}
function shiftOn(schedule: WorkSchedule, day: Date): Shift | null {
  const session = sessions(schedule).find((item) => item.day === day.getDay());
  if (session === undefined) return null;
  const endMinutes =
    session.workEnd <= session.workStart ? session.workEnd + MINUTES_PER_DAY : session.workEnd;
  return {
    start: sameDayAt(day, session.workStart),
    end: sameDayAt(day, endMinutes),
    paidFraction: 1 - session.workBreak / shiftMinutes(session.workStart, session.workEnd),
  };
}

/** Paid working time within a calendar interval, including a shift carried from the day before. */
function paidWithin(shift: Shift, from: number, to: number): number {
  return (
    Math.max(0, Math.min(to, shift.end.getTime()) - Math.max(from, shift.start.getTime())) *
    shift.paidFraction
  );
}

export function paidToday(schedule: WorkSchedule, now: Date): number {
  const midnight = sameDayAt(now, 0).getTime();
  return [-1, 0].reduce((total, offset) => {
    const shift = shiftOn(
      schedule,
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset),
    );
    return total + (shift === null ? 0 : paidWithin(shift, midnight, now.getTime()));
  }, 0);
}

/** Status follows a running overnight shift before looking at the shift starting today. */
export function workProgress(schedule: WorkSchedule, now: Date): WorkProgress {
  const previous = shiftOn(
    schedule,
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
  );
  const today = shiftOn(schedule, now);
  const active = previous !== null && previous.end.getTime() > now.getTime() ? previous : today;
  if (active === null)
    return {
      state: 'off',
      workedMs: 0,
      remainingMs: 0,
      start: sameDayAt(now, schedule.workStart),
      end: sameDayAt(now, schedule.workEnd),
    };
  const { start, end, paidFraction } = active;
  const workedMs =
    Math.min(Math.max(now.getTime() - start.getTime(), 0), end.getTime() - start.getTime()) *
    paidFraction;
  if (now < start) return { state: 'before', workedMs: 0, remainingMs: 0, start, end };
  if (now >= end) return { state: 'done', workedMs, remainingMs: 0, start, end };
  return { state: 'working', workedMs, remainingMs: end.getTime() - now.getTime(), start, end };
}

export interface MonthWorkProgress {
  /** Time worked so far this calendar month. */
  workedMs: number;
  /** All work time scheduled this calendar month. */
  scheduledMs: number;
}

/** Work done so far this calendar month against all the work scheduled in it. */
export function monthWorkProgress(schedule: WorkSchedule, now: Date): MonthWorkProgress {
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const result = { workedMs: 0, scheduledMs: 0 };
  for (let date = 0; date <= days; date += 1) {
    const shift = shiftOn(schedule, new Date(now.getFullYear(), now.getMonth(), date));
    if (shift === null) continue;
    result.scheduledMs += paidWithin(shift, first, last);
    result.workedMs += paidWithin(shift, first, Math.min(last, now.getTime()));
  }
  return result;
}

/**
 * When `workMs` of work, counted from `now` through the schedule, will be done.
 * Every whole week holds the same work, so all but the last are skipped at once.
 * Returns null for no work or for work too far ahead to name a date for.
 */
export function workDoneAt(schedule: WorkSchedule, workMs: number, now: Date): Date | null {
  if (!Number.isFinite(workMs) || workMs <= 0) return null;

  const weekMs = scheduleHours(schedule).weeklyHours * MINUTES_PER_HOUR * MS_PER_MINUTE;
  const skippedWeeks = Math.max(0, Math.floor(workMs / weekMs) - 1);
  if (skippedWeeks > MAX_WORK_WEEKS_AHEAD) return null;
  let remaining = workMs - skippedWeeks * weekMs;
  const from = new Date(now);
  from.setDate(from.getDate() + skippedWeeks * 7);
  for (let offset = -1; offset < MAX_DAYS_TO_WALK; offset += 1) {
    const shift = shiftOn(
      schedule,
      new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset),
    );
    if (shift === null) continue;
    const start = Math.max(shift.start.getTime(), from.getTime());
    const available = Math.max(0, shift.end.getTime() - start) * shift.paidFraction;
    if (available >= remaining) return new Date(start + remaining / shift.paidFraction);
    remaining -= available;
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
