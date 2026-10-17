import { describe, expect, it } from 'vitest';

import type { IncomeSettings } from './calculations';
import { formatTotalDuration } from './duration';

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
