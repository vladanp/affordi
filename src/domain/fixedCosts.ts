import {
  calculateIncomePercentage,
  calculatePeriodIncome,
  calculateWorkHours,
  type IncomeSettings,
} from './calculations';
import { isItemId, isItemName } from './items';
import { readRecord, writeRecord } from './localStore';
import { isMonthBefore, monthOf, monthsAfter, parseMonth, type CalendarMonth } from './months';

export const FIXED_COSTS_STORAGE_KEY = 'affordi.fixedCosts.v1';
export const MAX_FIXED_COSTS = 50;
const MONTHS_PER_YEAR = 12;
/** A year of 52 weeks, the same year the hourly rate and the earnings page use. */
const DAYS_PER_YEAR = 52 * 7;

/** A cost paid every month, such as rent or a loan. Loans can name their first and last payment. */
export interface FixedCost {
  id: string;
  name: string;
  /** The amount paid each month, in the settings currency. */
  amount: number;
  /** The month of the first payment as YYYY-MM, or null when it is not known. */
  firstPayment: string | null;
  /** The month of the last payment as YYYY-MM, or null for a cost that keeps going. */
  lastPayment: string | null;
}

function isMonthOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && parseMonth(value) !== null);
}

/** Months saved as YYYY-MM compare in order as text. */
function inPaymentOrder(first: string | null, last: string | null): boolean {
  return first === null || last === null || first <= last;
}

export function isFixedCost(value: unknown): value is FixedCost {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !('name' in value) ||
    !('amount' in value) ||
    !('firstPayment' in value) ||
    !('lastPayment' in value)
  ) {
    return false;
  }

  return (
    isItemId(value.id) &&
    isItemName(value.name) &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    isMonthOrNull(value.firstPayment) &&
    isMonthOrNull(value.lastPayment) &&
    inPaymentOrder(value.firstPayment, value.lastPayment)
  );
}

/** Costs saved before first payments existed have none. */
function withFirstPayment(value: unknown): unknown {
  return typeof value === 'object' && value !== null ? { firstPayment: null, ...value } : value;
}

/** Reads saved costs defensively, dropping any malformed or repeated entry. */
export function loadFixedCosts(): FixedCost[] {
  const saved = readRecord(FIXED_COSTS_STORAGE_KEY, 'fixedCosts');
  if (!Array.isArray(saved)) return [];

  const ids = new Set<string>();
  const costs: FixedCost[] = [];
  for (const entry of saved) {
    const value = withFirstPayment(entry);
    if (!isFixedCost(value) || ids.has(value.id)) continue;
    ids.add(value.id);
    costs.push({
      id: value.id,
      name: value.name,
      amount: value.amount,
      firstPayment: value.firstPayment,
      lastPayment: value.lastPayment,
    });
  }
  return costs.slice(0, MAX_FIXED_COSTS);
}

export function saveFixedCosts(costs: readonly FixedCost[]): boolean {
  return (
    costs.length <= MAX_FIXED_COSTS &&
    costs.every(isFixedCost) &&
    writeRecord(FIXED_COSTS_STORAGE_KEY, 'fixedCosts', costs)
  );
}

/** Whether the last payment of a cost came before the month of `now`. */
export function isPaidOff(cost: FixedCost, now: Date): boolean {
  const last = cost.lastPayment === null ? null : parseMonth(cost.lastPayment);
  return last !== null && isMonthBefore(last, now);
}

/** Costs still paid this month, largest first, then those already paid off. */
export function sortFixedCosts(costs: readonly FixedCost[], now: Date): FixedCost[] {
  return costs.toSorted(
    (first, second) =>
      Number(isPaidOff(first, now)) - Number(isPaidOff(second, now)) ||
      second.amount - first.amount,
  );
}

/** What the costs still paid this month add up to. */
export function monthlyFixedCosts(costs: readonly FixedCost[], now: Date): number {
  return costs.reduce((total, cost) => (isPaidOff(cost, now) ? total : total + cost.amount), 0);
}

function savedMonth(value: string | null): CalendarMonth | null {
  return value === null ? null : parseMonth(value);
}

/** Payments made before this month, counted from the first one and never past the last. */
function paymentsMade(first: CalendarMonth, last: CalendarMonth | null, now: Date): number {
  const before = monthsAfter(monthOf(now), first);
  const all = last === null ? before : monthsAfter(last, first) + 1;
  return Math.max(0, Math.min(before, all));
}

/** Payments from this month, or from a later first payment, through the last one. */
function paymentsLeft(first: CalendarMonth | null, last: CalendarMonth, now: Date): number {
  const current = monthOf(now);
  const start = first !== null && monthsAfter(first, current) > 0 ? first : current;
  return Math.max(0, monthsAfter(last, start) + 1);
}

/**
 * What a cost has come to so far and what it still will. This month's payment counts as
 * still to pay, the way this month's costs do everywhere else.
 */
export interface PaymentProgress {
  /** Paid before this month, or null when the first payment is not known. */
  paid: number | null;
  /** Still to pay through the last payment, or null for a cost that keeps going. */
  left: number | null;
}

export function paymentProgress(cost: FixedCost, now: Date): PaymentProgress {
  const first = savedMonth(cost.firstPayment);
  const last = savedMonth(cost.lastPayment);
  return {
    paid: first === null ? null : paymentsMade(first, last, now) * cost.amount,
    left: last === null ? null : paymentsLeft(first, last, now) * cost.amount,
  };
}

/** The paid part of a cost that has both ends and is still being paid, from 0 to 1. */
export function paidShare({ paid, left }: PaymentProgress): number | null {
  if (paid === null || left === null || left <= 0) return null;
  return paid / (paid + left);
}

/**
 * What is left to pay on the loans still being paid, and what is paid on them so far. A loan is
 * any cost with a last payment, so a subscription that keeps going is never one.
 */
export interface LoansSummary {
  /** The loans by name, the largest payment first. */
  names: string[];
  left: number;
  /** Paid so far, or null when a loan has no first payment. */
  paid: number | null;
  /** The month the last loan ends, as YYYY-MM. */
  lastPayment: string;
}

type Loan = FixedCost & { lastPayment: string };

export function summarizeLoans(costs: readonly FixedCost[], now: Date): LoansSummary | null {
  const loans = costs.filter(
    (cost): cost is Loan => cost.lastPayment !== null && !isPaidOff(cost, now),
  );
  if (loans.length === 0) return null;

  const progress = loans.map((cost) => paymentProgress(cost, now));
  const allPaidKnown = progress.every((loan) => loan.paid !== null);
  return {
    names: sortFixedCosts(loans, now).map((loan) => loan.name),
    left: progress.reduce((sum, loan) => sum + (loan.left ?? 0), 0),
    paid: allPaidKnown ? progress.reduce((sum, loan) => sum + (loan.paid ?? 0), 0) : null,
    lastPayment: loans
      .map((cost) => cost.lastPayment)
      .toSorted()
      .at(-1)!,
  };
}

/** One monthly amount in work time and as a percentage of monthly take home pay. */
export interface MonthlyCostFigures {
  workHours: number;
  percentage: number;
}

export function monthlyCostFigures(
  amount: number,
  settings: IncomeSettings,
): MonthlyCostFigures | null {
  const workHours = calculateWorkHours(amount, settings);
  const percentage = calculateIncomePercentage(amount, settings, 'monthly');
  return workHours === null || percentage === null ? null : { workHours, percentage };
}

/** Monthly take home pay after some monthly costs. */
export interface PayLeft {
  /** Negative when the costs are more than the pay. */
  left: number;
  /** What is left spread over every day of an average month. */
  leftPerDay: number;
}

export function payLeftAfter(costs: number, settings: IncomeSettings): PayLeft | null {
  const monthlyPay = calculatePeriodIncome(settings, 'monthly');
  if (monthlyPay === null) return null;
  const left = monthlyPay - costs;
  return { left, leftPerDay: (left * MONTHS_PER_YEAR) / DAYS_PER_YEAR };
}

/** How much of this month's costs the pay earned so far covers. */
export interface CostsCoverage {
  covered: number;
  total: number;
  /** The covered part, from 0 to 1. */
  share: number;
}

export function costsCoverage(earned: number, total: number): CostsCoverage | null {
  if (!(total > 0) || !Number.isFinite(earned)) return null;
  const covered = Math.min(Math.max(earned, 0), total);
  return { covered, total, share: covered / total };
}
