import { describe, expect, it } from 'vitest';

import type { Bill } from './bills';
import type { IncomeSettings } from './calculations';
import type { FixedCost } from './fixedCosts';
import { summarizeMonth } from './monthly';

const settings: IncomeSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};
const hourlyRate = (3_000 * 12) / (52 * 40);
/** Wednesday 21 October 2026. */
const october = new Date(2026, 9, 21, 12);

const fixedCosts: FixedCost[] = [
  { id: 'a', name: 'Mortgage', amount: 950, firstPayment: null, lastPayment: '2049-03' },
  { id: 'b', name: 'Insurance', amount: 120, firstPayment: null, lastPayment: null },
  { id: 'c', name: 'Car loan', amount: 380, firstPayment: null, lastPayment: '2026-09' },
];
const bills: Bill[] = [
  {
    id: 'e',
    name: 'Electricity',
    entries: [
      { month: '2026-09', amount: 80 },
      { month: '2026-10', amount: 100 },
    ],
  },
];

describe('monthly summary', () => {
  it('adds the fixed costs still paid to the average bills', () => {
    const summary = summarizeMonth(fixedCosts, bills, settings, october);
    expect(summary).not.toBeNull();
    expect(summary!.fixed).toBe(1_070);
    expect(summary!.bills).toBe(90);
    expect(summary!.total).toBe(1_160);
    expect(summary!.workHours).toBeCloseTo(1_160 / hourlyRate, 10);
    expect(summary!.percentage).toBeCloseTo((1_160 / 3_000) * 100, 10);
  });

  it('spreads what is left over every day of an average month', () => {
    const summary = summarizeMonth(fixedCosts, bills, settings, october);
    expect(summary!.left).toBe(1_840);
    expect(summary!.leftPerDay).toBeCloseTo((1_840 * 12) / 364, 10);
    expect(summarizeMonth([], [], settings, october)).toMatchObject({ total: 0, left: 3_000 });
  });

  it('shows a shortfall when the month costs more than take home pay', () => {
    const summary = summarizeMonth([{ ...fixedCosts[1]!, amount: 4_000 }], [], settings, october);
    expect(summary!.left).toBe(-1_000);
    expect(summary!.percentage).toBeCloseTo(133.33, 2);
  });
});
