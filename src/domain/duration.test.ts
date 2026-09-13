import { describe, expect, it } from 'vitest';

import type { IncomeSettings } from './calculations';
import { formatPrimaryDuration, formatWorkDuration } from './duration';

const settings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};

describe('formatWorkDuration', () => {
  it.each([
    [0, '0 minutes'],
    [0.001, 'Less than 1 minute'],
    [0.3, '18 minutes'],
    [1 / 60, '1 minute'],
    [1, '1 hour'],
    [2 + 35 / 60, '2 hours 35 minutes'],
    [7.5, '7 hours 30 minutes'],
    [8, '1 workday'],
    [12, '1 workday 4 hours'],
    [43.333_333, '5 workdays 3 hours'],
    [80, '2 workweeks'],
    [136, '3 workweeks 2 days'],
  ] as const)('formats %s hours as %s', (hours, expected) => {
    expect(formatWorkDuration(hours, settings, 'en')).toBe(expected);
  });

  it('uses custom working days to derive natural day and week units', () => {
    const fourDayWeek = { ...settings, weeklyHours: 32, workingDaysPerWeek: 4 };

    expect(formatWorkDuration(12, fourDayWeek, 'en')).toBe('1 workday 4 hours');
    expect(formatWorkDuration(80, fourDayWeek, 'en')).toBe('2 workweeks 2 days');
  });

  it('normalizes rounding across a workday boundary', () => {
    expect(formatWorkDuration(15.6, settings, 'en')).toBe('2 workdays');
  });

  it('rounds the smallest displayed unit deterministically', () => {
    expect(formatWorkDuration(2 + 34.4 / 60, settings, 'en')).toBe('2 hours 34 minutes');
    expect(formatWorkDuration(2 + 34.6 / 60, settings, 'en')).toBe('2 hours 35 minutes');
    expect(formatWorkDuration(84, settings, 'en')).toBe('2 workweeks 1 day');
  });

  it('caps impractically large output so it cannot break the interface', () => {
    expect(formatWorkDuration(40_000_000, settings, 'en')).toBe('More than 999,999 workweeks');
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'returns null for invalid work hours %s',
    (hours) => {
      expect(formatWorkDuration(hours, settings, 'en')).toBeNull();
    },
  );

  it('returns null for invalid work settings', () => {
    expect(formatWorkDuration(12, { ...settings, workingDaysPerWeek: 0 }, 'en')).toBeNull();
  });
});

describe('formatPrimaryDuration', () => {
  it.each([
    [0, '0 minutes of work'],
    [0.3, '18 minutes of work'],
    [2 + 35 / 60, '2 hours 35 minutes of work'],
    [43.333_333, '43 hours of work'],
  ] as const)('keeps the useful headline units for %s hours', (hours, expected) => {
    expect(formatPrimaryDuration(hours, settings, 'en')).toBe(expected);
  });

  it('uses the configured workweek for longer durations', () => {
    expect(formatPrimaryDuration(80, settings, 'en')).toBe('2 workweeks of work');
    expect(
      formatPrimaryDuration(80, { ...settings, weeklyHours: 32, workingDaysPerWeek: 4 }, 'en'),
    ).toBe('2 workweeks 2 days of work');
  });
});
