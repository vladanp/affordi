import { averageMonthlyBills, type Bill } from './bills';
import type { IncomeSettings } from './calculations';
import {
  monthlyCostFigures,
  monthlyFixedCosts,
  payLeftAfter,
  type FixedCost,
  type MonthlyCostFigures,
  type PayLeft,
} from './fixedCosts';

/**
 * What a typical month costs: the fixed costs still paid this month and the bills of an
 * average month, in work time, as a share of pay, and what is left of the pay.
 */
export interface MonthlySummary extends MonthlyCostFigures, PayLeft {
  fixed: number;
  bills: number;
  total: number;
}

export function summarizeMonth(
  fixedCosts: readonly FixedCost[],
  bills: readonly Bill[],
  settings: IncomeSettings,
  now: Date,
): MonthlySummary | null {
  const fixed = monthlyFixedCosts(fixedCosts, now);
  const billsAverage = averageMonthlyBills(bills, now);
  const total = fixed + billsAverage;
  const figures = monthlyCostFigures(total, settings);
  const payLeft = payLeftAfter(total, settings);
  if (figures === null || payLeft === null) return null;
  return { ...figures, ...payLeft, fixed, bills: billsAverage, total };
}
