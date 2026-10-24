import {
  calculateIncomePercentage,
  calculatePeriodIncome,
  calculateWorkHours,
  type IncomeSettings,
} from './calculations';
import { isItemId, isItemName } from './items';
import { readRecord, writeRecord } from './localStore';
import { isMonthBefore, parseMonth } from './months';

export const FIXED_COSTS_STORAGE_KEY = 'affordi.fixedCosts.v1';
export const MAX_FIXED_COSTS = 50;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** A cost paid every month, such as rent or a loan. Loans can name their last payment. */
export interface FixedCost {
  id: string;
  name: string;
  /** The amount paid each month, in the settings currency. */
  amount: number;
  /** The month of the last payment as YYYY-MM, or null for a cost that keeps going. */
  lastPayment: string | null;
}

export function isFixedCost(value: unknown): value is FixedCost {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !('name' in value) ||
    !('amount' in value) ||
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
    (value.lastPayment === null ||
      (typeof value.lastPayment === 'string' && parseMonth(value.lastPayment) !== null))
  );
}

/** Reads saved costs defensively, dropping any malformed or repeated entry. */
export function loadFixedCosts(): FixedCost[] {
  const saved = readRecord(FIXED_COSTS_STORAGE_KEY, 'fixedCosts');
  if (!Array.isArray(saved)) return [];

  const ids = new Set<string>();
  const costs: FixedCost[] = [];
  for (const value of saved) {
    if (!isFixedCost(value) || ids.has(value.id)) continue;
    ids.add(value.id);
    costs.push({
      id: value.id,
      name: value.name,
      amount: value.amount,
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
  /** What is left spread over the workdays of an average month. */
  leftPerWorkday: number;
}

export function payLeftAfter(costs: number, settings: IncomeSettings): PayLeft | null {
  const monthlyPay = calculatePeriodIncome(settings, 'monthly');
  if (monthlyPay === null) return null;
  const left = monthlyPay - costs;
  const workdaysPerMonth = (settings.workingDaysPerWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  return { left, leftPerWorkday: left / workdaysPerMonth };
}

export interface FixedCostsSummary extends MonthlyCostFigures, PayLeft {
  /** What the costs still paid this month add up to. */
  total: number;
}

export function summarizeFixedCosts(
  costs: readonly FixedCost[],
  settings: IncomeSettings,
  now: Date,
): FixedCostsSummary | null {
  const total = monthlyFixedCosts(costs, now);
  const figures = monthlyCostFigures(total, settings);
  const payLeft = payLeftAfter(total, settings);
  return figures === null || payLeft === null ? null : { ...figures, ...payLeft, total };
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
