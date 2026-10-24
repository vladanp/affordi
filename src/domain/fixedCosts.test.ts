import { beforeEach, describe, expect, it } from 'vitest';

import {
  FIXED_COSTS_STORAGE_KEY,
  fixedCostsCoverage,
  isFixedCost,
  isPaidOff,
  loadFixedCosts,
  monthlyCostFigures,
  monthlyFixedCosts,
  monthValue,
  parseMonth,
  saveFixedCosts,
  sortFixedCosts,
  summarizeFixedCosts,
  type FixedCost,
} from './fixedCosts';
import type { IncomeSettings } from './calculations';

const settings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};
const hourlyRate = (3_000 * 12) / (52 * 40);
/** Wednesday 21 October 2026. */
const october = new Date(2026, 9, 21, 12);

const mortgage: FixedCost = { id: 'a', name: 'Mortgage', amount: 950, lastPayment: '2049-03' };
const insurance: FixedCost = { id: 'b', name: 'Insurance', amount: 120, lastPayment: null };
const carLoan: FixedCost = { id: 'c', name: 'Car loan', amount: 380, lastPayment: '2026-09' };
const phone: FixedCost = { id: 'd', name: 'Phone', amount: 25, lastPayment: '2026-10' };

describe('months', () => {
  it('reads and writes months as YYYY-MM', () => {
    expect(parseMonth('2049-03')).toEqual({ year: 2049, month: 3 });
    expect(monthValue({ year: 2049, month: 3 })).toBe('2049-03');
    expect(parseMonth('2049-3')).toBeNull();
    expect(parseMonth('2049-13')).toBeNull();
    expect(parseMonth('2049-00')).toBeNull();
    expect(parseMonth('March 2049')).toBeNull();
  });

  it('counts a cost as paid off only after the month of its last payment', () => {
    expect(isPaidOff(phone, october)).toBe(false);
    expect(isPaidOff(phone, new Date(2026, 10, 1))).toBe(true);
    expect(isPaidOff(carLoan, october)).toBe(true);
    expect(isPaidOff(insurance, october)).toBe(false);
    expect(isPaidOff({ ...carLoan, lastPayment: '2027-01' }, new Date(2026, 11, 31))).toBe(false);
  });
});

describe('fixed cost values', () => {
  it('accepts a named positive monthly amount with an optional last payment', () => {
    expect(isFixedCost(mortgage)).toBe(true);
    expect(isFixedCost(insurance)).toBe(true);
  });

  it.each([
    null,
    'rent',
    { ...insurance, id: '' },
    { ...insurance, name: '' },
    { ...insurance, name: ' Rent' },
    { ...insurance, name: 'x'.repeat(61) },
    { ...insurance, amount: 0 },
    { ...insurance, amount: -5 },
    { ...insurance, amount: Number.POSITIVE_INFINITY },
    { ...insurance, amount: '120' },
    { ...insurance, lastPayment: '2049' },
    { id: 'b', name: 'Insurance', amount: 120 },
  ])('rejects invalid cost %#', (value) => {
    expect(isFixedCost(value)).toBe(false);
  });
});

describe('saved fixed costs', () => {
  beforeEach(() => localStorage.clear());

  it('round trips a versioned list', () => {
    expect(saveFixedCosts([mortgage, insurance])).toBe(true);
    expect(loadFixedCosts()).toEqual([mortgage, insurance]);
    expect(JSON.parse(localStorage.getItem(FIXED_COSTS_STORAGE_KEY) ?? '').version).toBe(1);
  });

  it('drops malformed and repeated entries and starts empty without a save', () => {
    expect(loadFixedCosts()).toEqual([]);
    localStorage.setItem(
      FIXED_COSTS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        fixedCosts: [mortgage, { ...insurance, amount: 0 }, { ...mortgage, name: 'Again' }, 4],
      }),
    );
    expect(loadFixedCosts()).toEqual([mortgage]);
    localStorage.setItem(FIXED_COSTS_STORAGE_KEY, '{"version":1,"fixedCosts":{}}');
    expect(loadFixedCosts()).toEqual([]);
  });

  it('refuses to save an invalid list', () => {
    expect(saveFixedCosts([{ ...mortgage, amount: 0 }])).toBe(false);
    expect(
      saveFixedCosts(Array.from({ length: 51 }, (_, i) => ({ ...insurance, id: `${i}` }))),
    ).toBe(false);
    expect(localStorage.getItem(FIXED_COSTS_STORAGE_KEY)).toBeNull();
  });
});

describe('fixed cost figures', () => {
  const costs = [insurance, carLoan, mortgage, phone];

  it('lists costs still paid by amount, then those paid off', () => {
    expect(sortFixedCosts(costs, october).map((cost) => cost.name)).toEqual([
      'Mortgage',
      'Insurance',
      'Phone',
      'Car loan',
    ]);
  });

  it('adds up only the costs still paid this month', () => {
    expect(monthlyFixedCosts(costs, october)).toBe(1_095);
    expect(monthlyFixedCosts(costs, new Date(2026, 10, 1))).toBe(1_070);
    expect(monthlyFixedCosts([], october)).toBe(0);
  });

  it('turns one monthly amount into work time and a share of monthly pay', () => {
    const figures = monthlyCostFigures(950, settings);
    expect(figures?.workHours).toBeCloseTo(950 / hourlyRate, 10);
    expect(figures?.percentage).toBeCloseTo((950 / 3_000) * 100, 10);
  });

  it('sums the month and spreads what is left over an average month of workdays', () => {
    const summary = summarizeFixedCosts(costs, settings, october);
    expect(summary).not.toBeNull();
    expect(summary!.total).toBe(1_095);
    expect(summary!.workHours).toBeCloseTo(1_095 / hourlyRate, 10);
    expect(summary!.percentage).toBeCloseTo(36.5, 10);
    expect(summary!.left).toBe(1_905);
    expect(summary!.leftPerWorkday).toBeCloseTo(1_905 / ((5 * 52) / 12), 10);
  });

  it('shows a shortfall when fixed costs are more than take home pay', () => {
    const summary = summarizeFixedCosts([{ ...insurance, amount: 4_000 }], settings, october);
    expect(summary!.left).toBe(-1_000);
    expect(summary!.percentage).toBeCloseTo(133.33, 2);
  });
});

describe('fixed costs coverage', () => {
  it('covers fixed costs with the pay earned so far, up to all of them', () => {
    expect(fixedCostsCoverage(725, 1_450)).toEqual({ covered: 725, total: 1_450, share: 0.5 });
    expect(fixedCostsCoverage(2_000, 1_450)).toEqual({ covered: 1_450, total: 1_450, share: 1 });
    expect(fixedCostsCoverage(0, 1_450)).toEqual({ covered: 0, total: 1_450, share: 0 });
  });

  it('has nothing to cover without fixed costs', () => {
    expect(fixedCostsCoverage(500, 0)).toBeNull();
    expect(fixedCostsCoverage(Number.NaN, 100)).toBeNull();
  });
});
