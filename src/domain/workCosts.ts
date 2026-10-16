import {
  calculatePeriodIncome,
  isValidIncomeSettings,
  MAX_COMMUTE_MINUTES,
  MAX_HOURS_PER_WORKDAY,
  type WorkCosts,
} from './calculations';
import type { Translator } from './i18n';
import { parseDecimalInput } from './input';

type WorkCostName = keyof WorkCosts;

/** An empty optional field means none; anything else must be an amount of 0 or more. */
export function parseOptionalAmount(value: string, locale: string): number | null {
  if (value.trim() === '') return 0;
  const amount = parseDecimalInput(value, locale);
  return amount !== null && amount >= 0 ? amount : null;
}

export interface ParsedWorkCosts {
  commuteMinutes: number | null;
  monthlyWorkCosts: number | null;
}

function commuteFits(commuteMinutes: number, income: unknown): boolean {
  if (commuteMinutes > MAX_COMMUTE_MINUTES) return false;
  if (!isValidIncomeSettings(income)) return true;
  const workdayHours = income.weeklyHours / income.workingDaysPerWeek;
  return workdayHours + commuteMinutes / 60 <= MAX_HOURS_PER_WORKDAY;
}

function costsFit(monthlyWorkCosts: number, income: unknown): boolean {
  if (monthlyWorkCosts === 0 || !isValidIncomeSettings(income)) return true;
  const monthlyIncome = calculatePeriodIncome(income, 'monthly');
  return monthlyIncome !== null && monthlyWorkCosts < monthlyIncome;
}

/** Errors for the commute and work cost fields, checked against the income being saved. */
export function workCostErrors(
  costs: ParsedWorkCosts,
  income: unknown,
  copy: Translator,
): Partial<Record<WorkCostName, string>> {
  const errors: Partial<Record<WorkCostName, string>> = {};
  if (costs.commuteMinutes === null || !commuteFits(costs.commuteMinutes, income)) {
    errors.commuteMinutes = copy.t('validation.commute');
  }
  if (costs.monthlyWorkCosts === null || !costsFit(costs.monthlyWorkCosts, income)) {
    errors.monthlyWorkCosts = copy.t('validation.workCosts');
  }
  return errors;
}
