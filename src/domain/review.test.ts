import { describe, expect, it } from 'vitest';
import { averageMonthlyBills, billHistoryMonths, isBill, mergeBill, type Bill } from './bills';
import { monthlyFixedCosts } from './fixedCosts';
import { translateDecimalInput } from './input';
import { mergeList } from './storageSync';

const now = new Date(2026, 10, 11);
describe('review regressions: values and persistence', () => {
  it('preserves grouped values across language changes', () => {
    expect(translateDecimalInput('3,000', 'en', 'de')).toBe('3000');
    expect(translateDecimalInput('1.234,50', 'de', 'en')).toBe('1234.5');
    expect(translateDecimalInput('', 'en', 'fr')).toBe('');
  });
  it('retains another tab’s additions and unedited fields', () => {
    const base = [{ id: 'a', name: 'Rent', amount: 900 }];
    const latest = [
      { id: 'a', name: 'Home', amount: 900 },
      { id: 'b', name: 'Phone', amount: 20 },
    ];
    expect(mergeList(base, [{ ...base[0]!, amount: 950 }], latest)).toEqual([
      { id: 'a', name: 'Home', amount: 950 },
      latest[1],
    ]);
    expect(mergeList(base, [], latest)).toEqual([latest[1]]);
  });
  it('merges separate months of one bill', () => {
    const base: Bill = { id: 'b', name: 'Power', entries: [{ month: '2026-10', amount: 10 }] };
    expect(
      mergeBill(
        base,
        { ...base, entries: [...base.entries, { month: '2026-11', amount: 20 }] },
        { ...base, entries: [{ month: '2026-10', amount: 15 }] },
      ).entries,
    ).toEqual([
      { month: '2026-10', amount: 15 },
      { month: '2026-11', amount: 20 },
    ]);
  });
  it('excludes scheduled future costs until their first payment', () => {
    const loan = {
      id: 'f',
      name: 'Future',
      amount: 500,
      firstPayment: '2027-01',
      lastPayment: '2027-12',
    };
    expect(monthlyFixedCosts([loan], now)).toBe(0);
    expect(monthlyFixedCosts([loan], new Date(2027, 0, 1))).toBe(500);
  });
  it('distinguishes a zero bill from a missing month and averages plotted totals', () => {
    const bills: Bill[] = [
      { id: 's', name: 'Summer', entries: [{ month: '2026-06', amount: 100 }] },
      { id: 'w', name: 'Winter', entries: [{ month: '2026-11', amount: 100 }] },
    ];
    expect(averageMonthlyBills(bills, now)).toBe(100);
    const zero: Bill = { ...bills[0]!, entries: [{ month: '2026-11', amount: 0 }] };
    expect(isBill(zero)).toBe(true);
    expect(averageMonthlyBills([zero], now)).toBe(0);
    expect(
      billHistoryMonths([{ ...zero, entries: [{ month: '2015-01', amount: 10 }] }], now)[0],
    ).toBe('2015-01');
  });
});
