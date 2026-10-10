import { describe, expect, it } from 'vitest';

import type { IncomeSettings } from './calculations';
import { formatSavingDuration, formatTotalDuration } from './duration';

const settings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};

describe('formatTotalDuration', () => {
  it.each([
    [0, '0 minutes'],
    [0.75, '45 minutes'],
    [9, '9 hours'],
    [79.4, '79 hours'],
    [520, '13 weeks'],
  ] as const)('formats %s hours as %s without the work suffix', (hours, expected) => {
    expect(formatTotalDuration(hours, settings, 'en')).toBe(expected);
  });

  it('returns null for invalid input', () => {
    expect(formatTotalDuration(-1, settings, 'en')).toBeNull();
    expect(formatTotalDuration(1, { ...settings, workingDaysPerWeek: 0 }, 'en')).toBeNull();
  });
});

describe('formatSavingDuration', () => {
  it.each([
    [0.1, 'under 1 week'],
    [0.25, '2 weeks'],
    [0.99, '4 weeks'],
    [1, '1 month'],
    [1.2, '2 months'],
    [3, '3 months'],
    [3.000_000_000_1, '3 months'],
    [23.5, '2 years'],
    [24, '2 years'],
    [30, '2 years and 6 months'],
    [1_188, '99 years'],
    [1_189, '99 years and 1 month'],
    [1_199.5, 'over 100 years'],
  ] as const)('formats %s months as %s', (months, expected) => {
    expect(formatSavingDuration(months, 'en')).toBe(expected);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('returns null for %s months', (months) => {
    expect(formatSavingDuration(months, 'en')).toBeNull();
  });

  it.each([
    ['de', 3, '3 Monate'],
    ['de', 0.1, 'unter 1 Woche'],
    ['fr', 1, '1 mois'],
    ['fr', 30, '2 ans et 6 mois'],
    ['it', 0.5, '3 settimane'],
    ['it', 13, '13 mesi'],
    ['sr', 1, '1 mesec'],
    ['sr', 3, '3 meseca'],
    ['sr', 5, '5 meseci'],
    ['sr', 26, '2 godine i 2 meseca'],
    ['sr', 60, '5 godina'],
    ['sr', 0.1, 'manje od nedelju dana'],
  ] as const)('writes %s saving time for %s months', (language, months, expected) => {
    expect(formatSavingDuration(months, language)).toBe(expected);
  });
});
