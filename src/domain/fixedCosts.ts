import {
  calculateIncomePercentage,
  calculatePeriodIncome,
  calculateWorkHours,
  type IncomeSettings,
} from './calculations';
import { readRecord, writeRecord } from './localStore';

export const FIXED_COSTS_STORAGE_KEY = 'affordi.fixedCosts.v1';
export const MAX_FIXED_COSTS = 50;
export const MAX_FIXED_COST_NAME_LENGTH = 60;
const MAX_ID_LENGTH = 64;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** A cost paid every month, such as rent or a loan. Loans can name their last payment. */
export interface FixedCost {
  id: string;
  name: string;
  /** The amount paid each month, in the settings currency. */
  amount: number;
  /** The month of the last payment as YYYY-MM, or null for a cost that keeps going. */
  lastPayment: string | null;
}

/** A calendar month with its month counted from 1 for January. */
export interface CalendarMonth {
  year: number;
  month: number;
}

export function parseMonth(value: string): CalendarMonth | null {
  const match = MONTH_PATTERN.exec(value);
  if (match === null) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function monthValue({ year, month }: CalendarMonth): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** Months counted from year 0, so two months compare as numbers. */
function monthNumber({ year, month }: CalendarMonth): number {
  return year * MONTHS_PER_YEAR + month - 1;
}

function monthOf(date: Date): CalendarMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** The first day of a month, for formatting it as a month and year. */
export function monthStart({ year, month }: CalendarMonth): Date {
  return new Date(year, month - 1, 1);
}

export function isFixedCostName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= MAX_FIXED_COST_NAME_LENGTH
  );
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
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    value.id.length <= MAX_ID_LENGTH &&
    isFixedCostName(value.name) &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    (value.lastPayment === null ||
      (typeof value.lastPayment === 'string' && parseMonth(value.lastPayment) !== null))
  );
}

export function createFixedCostId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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

/** Whether a month came before the month of `now`. */
export function isMonthBefore(month: CalendarMonth, now: Date): boolean {
  return monthNumber(month) < monthNumber(monthOf(now));
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

export interface FixedCostsSummary extends MonthlyCostFigures {
  /** What the costs still paid this month add up to. */
  total: number;
  /** Monthly take home pay after fixed costs, negative when they cost more. */
  left: number;
  /** What is left spread over the workdays of an average month. */
  leftPerWorkday: number;
}

export function summarizeFixedCosts(
  costs: readonly FixedCost[],
  settings: IncomeSettings,
  now: Date,
): FixedCostsSummary | null {
  const total = monthlyFixedCosts(costs, now);
  const figures = monthlyCostFigures(total, settings);
  const monthlyPay = calculatePeriodIncome(settings, 'monthly');
  if (figures === null || monthlyPay === null) return null;

  const left = monthlyPay - total;
  const workdaysPerMonth = (settings.workingDaysPerWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  return { ...figures, total, left, leftPerWorkday: left / workdaysPerMonth };
}

/** How much of this month's fixed costs the pay earned so far covers. */
export interface FixedCostsCoverage {
  covered: number;
  total: number;
  /** The covered part, from 0 to 1. */
  share: number;
}

export function fixedCostsCoverage(earned: number, total: number): FixedCostsCoverage | null {
  if (!(total > 0) || !Number.isFinite(earned)) return null;
  const covered = Math.min(Math.max(earned, 0), total);
  return { covered, total, share: covered / total };
}
