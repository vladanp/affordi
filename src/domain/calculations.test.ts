import { describe, expect, it } from 'vitest';

import {
  calculateHourlyRate,
  calculateHoursPerWorkday,
  calculateIncomePercentage,
  calculateWorkHours,
  isPayFrequency,
  isValidIncomeSettings,
  type IncomeSettings,
} from './calculations';

const monthlySettings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};

describe('calculateHourlyRate', () => {
  it.each([
    ['hourly', 25, 25],
    ['weekly', 1_000, 25],
    ['biweekly', 2_000, 25],
    ['monthly', 4_333.333_333_333_333, 25],
    ['yearly', 52_000, 25],
  ] as const)('normalizes %s income', (payFrequency, netIncome, expected) => {
    expect(calculateHourlyRate({ ...monthlySettings, netIncome, payFrequency })).toBeCloseTo(
      expected,
      10,
    );
  });

  it('accounts for custom weekly hours', () => {
    expect(calculateHourlyRate({ ...monthlySettings, netIncome: 5_200, weeklyHours: 30 })).toBe(40);
  });

  it.each([
    { ...monthlySettings, netIncome: 0 },
    { ...monthlySettings, netIncome: -1 },
    { ...monthlySettings, netIncome: Number.NaN },
    { ...monthlySettings, netIncome: Number.POSITIVE_INFINITY },
    { ...monthlySettings, weeklyHours: 0 },
    { ...monthlySettings, weeklyHours: 169 },
    { ...monthlySettings, workingDaysPerWeek: 0 },
    { ...monthlySettings, workingDaysPerWeek: 5.5 },
    { ...monthlySettings, workingDaysPerWeek: 8 },
  ])('returns null for invalid settings %#', (settings) => {
    expect(calculateHourlyRate(settings)).toBeNull();
  });

  it('returns null when normalization overflows', () => {
    expect(calculateHourlyRate({ ...monthlySettings, netIncome: Number.MAX_VALUE })).toBeNull();
  });
});

describe('calculateWorkHours', () => {
  it('calculates the reference monthly income example without losing precision', () => {
    expect(calculateHourlyRate(monthlySettings)).toBeCloseTo(17.307_692_307_7, 10);
    expect(calculateWorkHours(750, monthlySettings)).toBeCloseTo(43.333_333_333_3, 10);
  });

  it('supports decimal prices', () => {
    expect(
      calculateWorkHours(19.99, { ...monthlySettings, netIncome: 20, payFrequency: 'hourly' }),
    ).toBeCloseTo(0.9995, 12);
  });

  it('returns zero for a free item', () => {
    expect(calculateWorkHours(0, monthlySettings)).toBe(0);
  });

  it('supports very large finite values', () => {
    expect(
      calculateWorkHours(1_000_000_000_000, {
        ...monthlySettings,
        netIncome: 1,
        payFrequency: 'hourly',
      }),
    ).toBe(1_000_000_000_000);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'returns null for invalid item price %s',
    (itemPrice) => {
      expect(calculateWorkHours(itemPrice, monthlySettings)).toBeNull();
    },
  );

  it('returns null when the quotient overflows', () => {
    expect(
      calculateWorkHours(Number.MAX_VALUE, {
        ...monthlySettings,
        netIncome: Number.MIN_VALUE,
        payFrequency: 'hourly',
      }),
    ).toBeNull();
  });

  it('returns null for invalid income settings', () => {
    expect(calculateWorkHours(100, { ...monthlySettings, weeklyHours: 0 })).toBeNull();
  });
});

describe('income context and settings helpers', () => {
  it('calculates a price as a percentage of the configured pay period', () => {
    expect(calculateIncomePercentage(750, monthlySettings)).toBe(25);
    expect(calculateIncomePercentage(0, monthlySettings)).toBe(0);
  });

  it('rejects invalid inputs instead of returning NaN or Infinity', () => {
    expect(calculateIncomePercentage(-1, monthlySettings)).toBeNull();
    expect(calculateIncomePercentage(Number.NaN, monthlySettings)).toBeNull();
    expect(
      calculateIncomePercentage(Number.MAX_VALUE, { ...monthlySettings, netIncome: 1 }),
    ).toBeNull();
  });

  it('calculates hours per workday from custom work patterns', () => {
    expect(calculateHoursPerWorkday(monthlySettings)).toBe(8);
    expect(
      calculateHoursPerWorkday({ ...monthlySettings, weeklyHours: 37.5, workingDaysPerWeek: 5 }),
    ).toBe(7.5);
  });

  it('recognizes only supported pay frequencies', () => {
    expect(isPayFrequency('biweekly')).toBe(true);
    expect(isPayFrequency('fortnightly')).toBe(false);
    expect(isPayFrequency(null)).toBe(false);
  });

  it('validates a complete settings value', () => {
    expect(isValidIncomeSettings(monthlySettings)).toBe(true);
    expect(isValidIncomeSettings({ ...monthlySettings, workingDaysPerWeek: 0 })).toBe(false);
  });
});
