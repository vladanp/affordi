import { beforeEach, describe, expect, it } from 'vitest';

import {
  averageMonthlyBills,
  billAmount,
  BILLS_STORAGE_KEY,
  billStats,
  isBill,
  loadBills,
  missedLastMonth,
  monthlyBillTotals,
  saveBills,
  sortBills,
  summarizeBills,
  withBillAmount,
  withoutBillAmount,
  type Bill,
} from './bills';
/** Wednesday 21 October 2026, so the recent window runs from November 2025. */
const october = new Date(2026, 9, 21, 12);

const electricity: Bill = {
  id: 'e',
  name: 'Electricity',
  entries: [
    { month: '2025-10', amount: 200 },
    { month: '2025-11', amount: 90 },
    { month: '2026-01', amount: 120 },
    { month: '2026-09', amount: 80 },
    { month: '2026-10', amount: 91 },
  ],
};
const water: Bill = {
  id: 'w',
  name: 'Water',
  entries: [
    { month: '2026-09', amount: 30 },
    { month: '2026-10', amount: 34 },
  ],
};
const oldPhone: Bill = { id: 'p', name: 'Old phone', entries: [{ month: '2024-05', amount: 50 }] };
const bills = [water, oldPhone, electricity];

describe('bill values', () => {
  it('accepts a named bill with one positive amount per month, oldest first', () => {
    expect(isBill(electricity)).toBe(true);
    expect(isBill({ ...water, entries: [] })).toBe(true);
  });

  it.each([
    null,
    { ...water, name: '' },
    { ...water, id: '' },
    { ...water, entries: 'none' },
    { ...water, entries: [{ month: '2026-10', amount: 0 }] },
    { ...water, entries: [{ month: '2026-13', amount: 5 }] },
    { ...water, entries: water.entries.toReversed() },
    { ...water, entries: [water.entries[0], water.entries[0]] },
    {
      ...water,
      entries: Array.from({ length: 121 }, (_, index) => ({
        month: `${2000 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`,
        amount: 1,
      })),
    },
  ])('rejects invalid bill %#', (value) => {
    expect(isBill(value)).toBe(false);
  });
});

describe('saved bills', () => {
  beforeEach(() => localStorage.clear());

  it('round trips a versioned list and drops malformed or repeated bills', () => {
    expect(saveBills([electricity, water])).toBe(true);
    expect(loadBills()).toEqual([electricity, water]);
    expect(JSON.parse(localStorage.getItem(BILLS_STORAGE_KEY) ?? '').version).toBe(1);

    localStorage.setItem(
      BILLS_STORAGE_KEY,
      JSON.stringify({ version: 1, bills: [water, { ...water, name: 'Again' }, { id: 'x' }] }),
    );
    expect(loadBills()).toEqual([water]);
    localStorage.setItem(BILLS_STORAGE_KEY, '{"version":1,"bills":"none"}');
    expect(loadBills()).toEqual([]);
  });

  it('refuses to save an invalid list', () => {
    expect(saveBills([{ ...water, name: ' ' }])).toBe(false);
    expect(localStorage.getItem(BILLS_STORAGE_KEY)).toBeNull();
  });
});

describe('monthly amounts', () => {
  it('adds a month in order and replaces a month already saved', () => {
    const added = withBillAmount(electricity, '2026-03', 110);
    expect(added.entries.map((entry) => entry.month)).toEqual([
      '2025-10',
      '2025-11',
      '2026-01',
      '2026-03',
      '2026-09',
      '2026-10',
    ]);
    expect(billAmount(withBillAmount(water, '2026-10', 40), '2026-10')).toBe(40);
    expect(withBillAmount(water, '2026-10', 40).entries).toHaveLength(2);
    expect(billAmount(water, '2026-08')).toBeNull();
  });

  it('clears the amount of one month and keeps the others', () => {
    expect(withoutBillAmount(water, '2026-09').entries).toEqual([{ month: '2026-10', amount: 34 }]);
    expect(withoutBillAmount(water, '2026-08')).toEqual(water);
  });

  it('keeps the newest ten years of amounts', () => {
    let bill: Bill = { ...water, entries: [] };
    for (let index = 0; index < 125; index += 1) {
      const month = `${2010 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
      bill = withBillAmount(bill, month, 10);
    }
    expect(bill.entries).toHaveLength(120);
    expect(bill.entries[0]!.month).toBe('2010-06');
    expect(isBill(bill)).toBe(true);
  });
});

describe('bill figures', () => {
  it('averages the months with an amount in the last twelve', () => {
    expect(billStats(electricity, october)).toEqual({
      average: (90 + 120 + 80 + 91) / 4,
      latest: { month: '2026-10', amount: 91 },
    });
    expect(billStats(oldPhone, october)).toEqual({
      average: null,
      latest: { month: '2024-05', amount: 50 },
    });
    expect(billStats({ ...water, entries: [] }, october)).toEqual({ average: null, latest: null });
  });

  it('adds the averages up for a typical month and sorts by them', () => {
    expect(averageMonthlyBills(bills, october)).toBeCloseTo(95.25 + 32, 10);
    expect(sortBills(bills, october).map((bill) => bill.name)).toEqual([
      'Electricity',
      'Water',
      'Old phone',
    ]);
  });

  it('totals each of the last twelve months, leaving months without amounts empty', () => {
    const totals = monthlyBillTotals(bills, october);
    expect(totals).toHaveLength(12);
    expect(totals[0]).toEqual({ month: '2025-11', total: 90 });
    expect(totals[1]).toEqual({ month: '2025-12', total: null });
    expect(totals.at(-2)).toEqual({ month: '2026-09', total: 110 });
    expect(totals.at(-1)).toEqual({ month: '2026-10', total: 125 });
  });

  it('sums up the last twelve months for the chart', () => {
    const summary = summarizeBills(bills, october);
    expect(summary.average).toBeCloseTo(127.25, 10);
    expect(summary.totals).toEqual(monthlyBillTotals(bills, october));
    expect(summarizeBills([{ ...water, entries: [water.entries[1]!] }], october).average).toBe(34);
    expect(summarizeBills([], october).average).toBe(0);
  });
});

describe('forgotten amounts', () => {
  /** Wednesday 18 November 2026: October is last month and September the month before. */
  const november = new Date(2026, 10, 18, 12);
  const heating: Bill = {
    id: 'h',
    name: 'Heating',
    entries: [{ month: '2026-04', amount: 60 }],
  };

  it('names the bills paid in September with no amount for October', () => {
    const noOctober = { ...water, entries: water.entries.slice(0, 1) };
    expect(missedLastMonth([electricity, noOctober, heating], november)).toEqual({
      month: '2026-10',
      bills: [noOctober],
    });
  });

  it('names no bill that has last month’s amount or was not paid the month before', () => {
    expect(missedLastMonth([electricity, water, heating, oldPhone], november)).toBeNull();
    // In October, last month is September, and the bills paid in August have amounts for it.
    expect(missedLastMonth([electricity, water], october)).toBeNull();
    expect(missedLastMonth([], november)).toBeNull();
  });
});
