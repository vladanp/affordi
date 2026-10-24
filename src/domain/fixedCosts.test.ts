import { beforeEach, describe, expect, it } from 'vitest';

import {
  costsCoverage,
  FIXED_COSTS_STORAGE_KEY,
  isFixedCost,
  isPaidOff,
  loadFixedCosts,
  monthlyCostFigures,
  monthlyFixedCosts,
  paidShare,
  paymentProgress,
  saveFixedCosts,
  sortFixedCosts,
  summarizeLoans,
  type FixedCost,
} from './fixedCosts';
import type { IncomeSettings } from './calculations';
import { monthValue, parseMonth, recentMonths } from './months';

const settings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};
const hourlyRate = (3_000 * 12) / (52 * 40);
/** Wednesday 21 October 2026. */
const october = new Date(2026, 9, 21, 12);

const mortgage: FixedCost = {
  id: 'a',
  name: 'Mortgage',
  amount: 950,
  firstPayment: null,
  lastPayment: '2049-03',
};
const insurance: FixedCost = {
  id: 'b',
  name: 'Insurance',
  amount: 120,
  firstPayment: null,
  lastPayment: null,
};
const carLoan: FixedCost = {
  id: 'c',
  name: 'Car loan',
  amount: 380,
  firstPayment: null,
  lastPayment: '2026-09',
};
const phone: FixedCost = {
  id: 'd',
  name: 'Phone',
  amount: 25,
  firstPayment: null,
  lastPayment: '2026-10',
};

describe('months', () => {
  it('reads and writes months as YYYY-MM', () => {
    expect(parseMonth('2049-03')).toEqual({ year: 2049, month: 3 });
    expect(monthValue({ year: 2049, month: 3 })).toBe('2049-03');
    expect(parseMonth('2049-3')).toBeNull();
    expect(parseMonth('2049-13')).toBeNull();
    expect(parseMonth('2049-00')).toBeNull();
    expect(parseMonth('March 2049')).toBeNull();
  });

  it('lists the months that end with this one, across a new year', () => {
    expect(recentMonths(new Date(2027, 1, 10), 3)).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
      { year: 2027, month: 2 },
    ]);
    expect(recentMonths(october, 12)[0]).toEqual({ year: 2025, month: 11 });
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
  it('accepts a named positive monthly amount with an optional first and last payment', () => {
    expect(isFixedCost(mortgage)).toBe(true);
    expect(isFixedCost(insurance)).toBe(true);
    expect(isFixedCost({ ...mortgage, firstPayment: '2024-01' })).toBe(true);
    expect(isFixedCost({ ...mortgage, firstPayment: '2049-03' })).toBe(true);
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
    { ...insurance, firstPayment: '2024' },
    { ...mortgage, firstPayment: '2049-04' },
    { id: 'b', name: 'Insurance', amount: 120, lastPayment: null },
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

  it('loads costs saved before first payments with none', () => {
    localStorage.setItem(
      FIXED_COSTS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        fixedCosts: [{ id: 'a', name: 'Mortgage', amount: 950, lastPayment: '2049-03' }],
      }),
    );
    expect(loadFixedCosts()).toEqual([mortgage]);
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
});

describe('fixed costs coverage', () => {
  it('covers fixed costs with the pay earned so far, up to all of them', () => {
    expect(costsCoverage(725, 1_450)).toEqual({ covered: 725, total: 1_450, share: 0.5 });
    expect(costsCoverage(2_000, 1_450)).toEqual({ covered: 1_450, total: 1_450, share: 1 });
    expect(costsCoverage(0, 1_450)).toEqual({ covered: 0, total: 1_450, share: 0 });
  });

  it('has nothing to cover without fixed costs', () => {
    expect(costsCoverage(500, 0)).toBeNull();
    expect(costsCoverage(Number.NaN, 100)).toBeNull();
  });
});

describe('loan progress', () => {
  // By October 2026, the payments from January 2024 through September 2026 are made.
  const loan: FixedCost = { ...mortgage, firstPayment: '2024-01' };

  it('counts payments before this month as paid and the rest, from this month, as left', () => {
    expect(paymentProgress(loan, october)).toEqual({ paid: 33 * 950, left: 270 * 950 });
    expect(paidShare(paymentProgress(loan, october))).toBeCloseTo(33 / 303, 10);
  });

  it('knows what is left only with a last payment and what is paid only with a first', () => {
    expect(paymentProgress(mortgage, october)).toEqual({ paid: null, left: 270 * 950 });
    expect(paymentProgress({ ...insurance, firstPayment: '2026-01' }, october)).toEqual({
      paid: 9 * 120,
      left: null,
    });
    expect(paymentProgress(insurance, october)).toEqual({ paid: null, left: null });
    expect(paidShare(paymentProgress(mortgage, october))).toBeNull();
  });

  it('counts nothing paid before a later first payment and all of it after the last', () => {
    const future = { ...mortgage, firstPayment: '2027-01', lastPayment: '2027-12' };
    expect(paymentProgress(future, october)).toEqual({ paid: 0, left: 12 * 950 });
    const ended = { ...carLoan, firstPayment: '2024-10' };
    expect(paymentProgress(ended, october)).toEqual({ paid: 24 * 380, left: 0 });
    expect(paidShare(paymentProgress(ended, october))).toBeNull();
  });

  it('adds up loans still paid, with what is paid once every first payment is known', () => {
    // A cost that keeps going, such as a subscription, is never a loan, nor is one that ended.
    expect(summarizeLoans([insurance, carLoan], october)).toBeNull();
    expect(summarizeLoans([phone, loan, carLoan, insurance], october)).toEqual({
      left: 270 * 950 + 25,
      paid: null,
      lastPayment: '2049-03',
    });
    expect(summarizeLoans([loan, { ...phone, firstPayment: '2026-07' }], october)).toEqual({
      left: 270 * 950 + 25,
      paid: 33 * 950 + 3 * 25,
      lastPayment: '2049-03',
    });
  });
});
