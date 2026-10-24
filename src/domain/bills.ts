import { isItemId, isItemName } from './items';
import { readRecord, writeRecord } from './localStore';
import { monthValue, parseMonth, recentMonths } from './months';

export const BILLS_STORAGE_KEY = 'affordi.bills.v1';
export const MAX_BILLS = 20;
/** Ten years of monthly amounts for each bill. */
const MAX_BILL_ENTRIES = 120;
/** Averages and the chart look back over this many months, ending with this one. */
const RECENT_MONTHS = 12;

/** What a bill came to in one month, saved as YYYY-MM. */
export interface BillEntry {
  month: string;
  amount: number;
}

/** A bill that changes from month to month, such as electricity, with one amount per month. */
export interface Bill {
  id: string;
  name: string;
  /** Oldest first, one entry per month. */
  entries: BillEntry[];
}

function isBillEntry(value: unknown): value is BillEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'month' in value &&
    'amount' in value &&
    typeof value.month === 'string' &&
    parseMonth(value.month) !== null &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0
  );
}

/** Entries in order of their months, with no month twice. */
function inMonthOrder(entries: readonly BillEntry[]): boolean {
  return entries.every((entry, index) => index === 0 || entries[index - 1]!.month < entry.month);
}

export function isBill(value: unknown): value is Bill {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !('name' in value) ||
    !('entries' in value) ||
    !Array.isArray(value.entries)
  ) {
    return false;
  }

  const entries: unknown[] = value.entries;
  return (
    isItemId(value.id) &&
    isItemName(value.name) &&
    entries.length <= MAX_BILL_ENTRIES &&
    entries.every(isBillEntry) &&
    inMonthOrder(entries.filter(isBillEntry))
  );
}

/** Reads saved bills defensively, dropping any malformed or repeated bill. */
export function loadBills(): Bill[] {
  const saved = readRecord(BILLS_STORAGE_KEY, 'bills');
  if (!Array.isArray(saved)) return [];

  const ids = new Set<string>();
  const bills: Bill[] = [];
  for (const value of saved) {
    if (!isBill(value) || ids.has(value.id)) continue;
    ids.add(value.id);
    bills.push({
      id: value.id,
      name: value.name,
      entries: value.entries.map(({ month, amount }) => ({ month, amount })),
    });
  }
  return bills.slice(0, MAX_BILLS);
}

export function saveBills(bills: readonly Bill[]): boolean {
  return (
    bills.length <= MAX_BILLS &&
    bills.every(isBill) &&
    writeRecord(BILLS_STORAGE_KEY, 'bills', bills)
  );
}

/** The bill with an amount for a month, replacing one already there and keeping the newest. */
export function withBillAmount(bill: Bill, month: string, amount: number): Bill {
  const entries = [...bill.entries.filter((entry) => entry.month !== month), { month, amount }];
  return {
    ...bill,
    entries: entries
      .toSorted((first, second) => first.month.localeCompare(second.month))
      .slice(-MAX_BILL_ENTRIES),
  };
}

/** The bill without an amount for a month. */
export function withoutBillAmount(bill: Bill, month: string): Bill {
  return { ...bill, entries: bill.entries.filter((entry) => entry.month !== month) };
}

/** The amount saved for a month, if any. */
export function billAmount(bill: Bill, month: string): number | null {
  return bill.entries.find((entry) => entry.month === month)?.amount ?? null;
}

/** The months of the recent window as YYYY-MM, oldest first. */
function recentMonthValues(now: Date): string[] {
  return recentMonths(now, RECENT_MONTHS).map(monthValue);
}

/** A bill's recent average and its latest amount, which may be older than the window. */
export interface BillStats {
  /** The average over the months with an amount in the recent window, or null without one. */
  average: number | null;
  latest: BillEntry | null;
}

export function billStats(bill: Bill, now: Date): BillStats {
  const window = new Set(recentMonthValues(now));
  const recent = bill.entries.filter((entry) => window.has(entry.month));
  const average =
    recent.length === 0
      ? null
      : recent.reduce((sum, entry) => sum + entry.amount, 0) / recent.length;
  return { average, latest: bill.entries.at(-1) ?? null };
}

/** Bills with the highest average first, then those without recent amounts. */
export function sortBills(bills: readonly Bill[], now: Date): Bill[] {
  return bills.toSorted(
    (first, second) =>
      (billStats(second, now).average ?? -1) - (billStats(first, now).average ?? -1),
  );
}

/** All bills added up for one month, or null when no bill has an amount for it. */
export interface MonthTotal {
  month: string;
  total: number | null;
}

export function monthlyBillTotals(bills: readonly Bill[], now: Date): MonthTotal[] {
  return recentMonthValues(now).map((month) => {
    const amounts = bills.flatMap((bill) => {
      const amount = billAmount(bill, month);
      return amount === null ? [] : [amount];
    });
    return {
      month,
      total: amounts.length === 0 ? null : amounts.reduce((sum, amount) => sum + amount, 0),
    };
  });
}

/** What bills cost in a typical month: each bill's recent average, added up. */
export function averageMonthlyBills(bills: readonly Bill[], now: Date): number {
  return bills.reduce((sum, bill) => sum + (billStats(bill, now).average ?? 0), 0);
}

interface MonthAmount {
  month: string;
  total: number;
}

/** The last twelve months of bills, for the chart. */
export interface BillsSummary {
  /** What bills cost in a typical month. */
  average: number;
  /** The highest and lowest recent months, once two months have amounts. */
  highest: MonthAmount | null;
  lowest: MonthAmount | null;
  totals: MonthTotal[];
}

export function summarizeBills(bills: readonly Bill[], now: Date): BillsSummary {
  const totals = monthlyBillTotals(bills, now);
  const months = totals.flatMap(({ month, total }) => (total === null ? [] : [{ month, total }]));
  const byTotal = months.toSorted((first, second) => second.total - first.total);
  const compared = byTotal.length >= 2;
  return {
    average: averageMonthlyBills(bills, now),
    highest: compared ? byTotal[0]! : null,
    lowest: compared ? byTotal.at(-1)! : null,
    totals,
  };
}
