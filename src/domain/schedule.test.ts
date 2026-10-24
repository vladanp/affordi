import { describe, expect, it } from 'vitest';

import {
  isWorkSchedule,
  minutesLeft,
  monthWorkProgress,
  msSinceMidnight,
  parseTimeInput,
  scheduleFromWeeklyHours,
  scheduleHours,
  timeInputValue,
  workDoneAt,
  workProgress,
  type WorkSchedule,
} from './schedule';

const officeHours: WorkSchedule = { workStart: 540, workEnd: 1020, workDays: [1, 2, 3, 4, 5] };
/** Wednesday 21 October 2026 at a local time. */
const wednesday = (hours: number, minutes = 0) => new Date(2026, 9, 21, hours, minutes);
const hours = (count: number) => count * 3_600_000;

describe('work schedules', () => {
  it('accepts a schedule within one day with ascending work days', () => {
    expect(isWorkSchedule(officeHours)).toBe(true);
    expect(isWorkSchedule({ workStart: 0, workEnd: 1440, workDays: [0, 1, 2, 3, 4, 5, 6] })).toBe(
      true,
    );
  });

  it.each([
    null,
    'office',
    { workStart: 540, workEnd: 1020 },
    { ...officeHours, workEnd: 540 },
    { ...officeHours, workEnd: 480 },
    { ...officeHours, workStart: -1 },
    { ...officeHours, workStart: 1440, workEnd: 1440 },
    { ...officeHours, workEnd: 1441 },
    { ...officeHours, workStart: 540.5 },
    { ...officeHours, workDays: [] },
    { ...officeHours, workDays: [1, 1] },
    { ...officeHours, workDays: [5, 1] },
    { ...officeHours, workDays: [7] },
    { ...officeHours, workDays: '1,2' },
  ])('rejects invalid schedule %#', (schedule) => {
    expect(isWorkSchedule(schedule)).toBe(false);
  });

  it('derives weekly hours and work days from the schedule', () => {
    expect(scheduleHours(officeHours)).toEqual({ weeklyHours: 40, workingDaysPerWeek: 5 });
    expect(scheduleHours({ workStart: 510, workEnd: 960, workDays: [1, 3] })).toEqual({
      weeklyHours: 15,
      workingDaysPerWeek: 2,
    });
  });
});

describe('schedules for saves from before work times', () => {
  it.each([
    [40, 5, { workStart: 540, workEnd: 1020, workDays: [1, 2, 3, 4, 5] }],
    [37.5, 5, { workStart: 540, workEnd: 990, workDays: [1, 2, 3, 4, 5] }],
    [48, 6, { workStart: 540, workEnd: 1020, workDays: [1, 2, 3, 4, 5, 6] }],
    [70, 7, { workStart: 540, workEnd: 1140, workDays: [0, 1, 2, 3, 4, 5, 6] }],
    [60, 3, { workStart: 240, workEnd: 1440, workDays: [1, 2, 3] }],
    [168, 7, { workStart: 0, workEnd: 1440, workDays: [0, 1, 2, 3, 4, 5, 6] }],
  ] as const)('places %s hours over %s days', (weeklyHours, days, expected) => {
    const schedule = scheduleFromWeeklyHours(weeklyHours, days);
    expect(schedule).toEqual(expected);
    expect(isWorkSchedule(schedule)).toBe(true);
  });

  it('keeps the closest whole minute', () => {
    const schedule = scheduleFromWeeklyHours(39, 7);
    expect(schedule).toMatchObject({ workStart: 540, workEnd: 874 });
  });

  it.each([
    [100, 4],
    [0, 5],
    [169, 7],
    [40, 0],
    [40, 5.5],
    ['40', 5],
    [Number.NaN, 5],
    [undefined, undefined],
  ])('returns null for %s hours over %s days', (weeklyHours, days) => {
    expect(scheduleFromWeeklyHours(weeklyHours, days)).toBeNull();
  });
});

describe('time fields', () => {
  it.each([
    ['09:30', 'start', 570],
    ['9:30', 'start', 570],
    ['09:30:15', 'start', 570],
    [' 17:05 ', 'end', 1025],
    ['00:00', 'start', 0],
    ['00:00', 'end', 1440],
    ['23:59', 'end', 1439],
  ] as const)('reads %s as a %s time', (value, role, expected) => {
    expect(parseTimeInput(value, role)).toBe(expected);
  });

  it.each(['', '24:00', '12:60', '9', '9.30', 'nine'])('rejects %s', (value) => {
    expect(parseTimeInput(value, 'start')).toBeNull();
  });

  it('writes field values with two digit hours and midnight as 00:00', () => {
    expect(timeInputValue(570)).toBe('09:30');
    expect(timeInputValue(0)).toBe('00:00');
    expect(timeInputValue(1439)).toBe('23:59');
    expect(timeInputValue(1440)).toBe('00:00');
  });
});

describe('work progress', () => {
  it('waits before work on a work day', () => {
    expect(workProgress(officeHours, wednesday(8, 59))).toEqual({
      state: 'before',
      workedMs: 0,
      remainingMs: 0,
      start: wednesday(9),
      end: wednesday(17),
    });
  });

  it('counts time worked and left during work', () => {
    expect(workProgress(officeHours, wednesday(9))).toMatchObject({
      state: 'working',
      workedMs: 0,
      remainingMs: 8 * 3_600_000,
    });
    expect(workProgress(officeHours, wednesday(13, 48))).toMatchObject({
      state: 'working',
      workedMs: (4 * 60 + 48) * 60_000,
      remainingMs: (3 * 60 + 12) * 60_000,
    });
  });

  it('keeps the full day once work is done', () => {
    expect(workProgress(officeHours, wednesday(17))).toMatchObject({
      state: 'done',
      workedMs: 8 * 3_600_000,
      remainingMs: 0,
    });
  });

  it('rests on days that are not work days', () => {
    expect(workProgress(officeHours, new Date(2026, 9, 24, 12))).toMatchObject({
      state: 'off',
      workedMs: 0,
    });
  });

  it('ends a workday at the midnight that closes it', () => {
    const evening: WorkSchedule = { workStart: 1080, workEnd: 1440, workDays: [3] };
    const progress = workProgress(evening, wednesday(23, 30));
    expect(progress).toMatchObject({ state: 'working', remainingMs: 30 * 60_000 });
    expect(progress.end).toEqual(new Date(2026, 9, 22));
  });

  it('counts this month’s work done against all of it', () => {
    const hour = 3_600_000;
    expect(monthWorkProgress(officeHours, wednesday(12))).toEqual({
      workedMs: (14 * 8 + 3) * hour,
      scheduledMs: 22 * 8 * hour,
      workdaysDone: 14,
      workdaysTotal: 22,
    });
    expect(monthWorkProgress(officeHours, new Date(2026, 9, 1, 8))).toMatchObject({
      workedMs: 0,
      workdaysDone: 0,
    });
    expect(monthWorkProgress(officeHours, new Date(2026, 9, 31, 23))).toMatchObject({
      workedMs: 22 * 8 * hour,
      workdaysDone: 22,
    });
  });

  it('follows the length of the month and the chosen work days', () => {
    const weekends: WorkSchedule = { workStart: 600, workEnd: 840, workDays: [0, 6] };
    expect(monthWorkProgress(officeHours, new Date(2027, 1, 10))).toMatchObject({
      workdaysTotal: 20,
    });
    expect(monthWorkProgress(weekends, new Date(2026, 9, 25, 12))).toEqual({
      workedMs: (7 * 4 + 2) * 3_600_000,
      scheduledMs: 9 * 4 * 3_600_000,
      workdaysDone: 7,
      workdaysTotal: 9,
    });
  });

  it('finds when work counted from now will be done', () => {
    expect(workDoneAt(officeHours, hours(2), wednesday(12))).toEqual(wednesday(14));
    expect(workDoneAt(officeHours, hours(5), wednesday(12))).toEqual(wednesday(17));
    expect(workDoneAt(officeHours, hours(6), wednesday(12))).toEqual(new Date(2026, 9, 22, 10));
    expect(workDoneAt(officeHours, hours(1), wednesday(20))).toEqual(new Date(2026, 9, 22, 10));
    expect(workDoneAt(officeHours, hours(1), new Date(2026, 9, 24, 12))).toEqual(
      new Date(2026, 9, 26, 10),
    );
    expect(workDoneAt(officeHours, hours(3), new Date(2026, 9, 23, 16))).toEqual(
      new Date(2026, 9, 26, 11),
    );
  });

  it('skips whole weeks of work for large amounts', () => {
    expect(workDoneAt(officeHours, hours(43), wednesday(12))).toEqual(new Date(2026, 9, 28, 15));
    expect(workDoneAt(officeHours, hours(400), wednesday(12))).toEqual(new Date(2026, 11, 30, 12));
  });

  it('names no time for no work or work beyond a century', () => {
    expect(workDoneAt(officeHours, 0, wednesday(12))).toBeNull();
    expect(workDoneAt(officeHours, Number.NaN, wednesday(12))).toBeNull();
    expect(workDoneAt(officeHours, 1e12 * 3_600_000, wednesday(12))).toBeNull();
  });

  it('rounds the time left up to whole minutes', () => {
    expect(minutesLeft(0)).toBe(0);
    expect(minutesLeft(1)).toBe(1);
    expect(minutesLeft(60_000)).toBe(1);
    expect(minutesLeft(60_001)).toBe(2);
  });

  it('measures time since local midnight', () => {
    expect(msSinceMidnight(wednesday(0))).toBe(0);
    expect(msSinceMidnight(wednesday(12, 30))).toBe(12.5 * 3_600_000);
  });
});
