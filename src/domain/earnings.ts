import {
  calculateHourlyRate,
  calculateHoursPerWorkday,
  calculatePeriodIncome,
} from './calculations';
import { msSinceMidnight, workProgress, type WorkProgress } from './schedule';
import type { AffordiSettings } from './storage';

const HOURS_PER_WEEK = 7 * 24;
const MS_PER_HOUR = 3_600_000;
const MS_PER_WEEK = HOURS_PER_WEEK * MS_PER_HOUR;

export const rateUnits = ['second', 'minute', 'hour', 'day'] as const;
export type RateUnit = (typeof rateUnits)[number];
export const totalPeriods = ['week', 'month', 'year'] as const;
export type TotalPeriod = (typeof totalPeriods)[number];

/**
 * Pay over the same week, spread two ways: over all 168 hours of the week, or
 * only over working time. A week, month, and year are the same either way.
 */
export interface EarningRates {
  aroundTheClock: Record<RateUnit, number>;
  atWork: Record<RateUnit, number>;
  totals: Record<TotalPeriod, number>;
}

function perUnit(hourlyRate: number, hoursPerDay: number): Record<RateUnit, number> {
  return {
    second: hourlyRate / 3_600,
    minute: hourlyRate / 60,
    hour: hourlyRate,
    day: hourlyRate * hoursPerDay,
  };
}

export function calculateEarningRates(settings: AffordiSettings): EarningRates | null {
  const week = calculatePeriodIncome(settings, 'weekly');
  const month = calculatePeriodIncome(settings, 'monthly');
  const year = calculatePeriodIncome(settings, 'yearly');
  const hourly = calculateHourlyRate(settings);
  const hoursPerWorkday = calculateHoursPerWorkday(settings);
  if (
    week === null ||
    month === null ||
    year === null ||
    hourly === null ||
    hoursPerWorkday === null
  ) {
    return null;
  }

  return {
    aroundTheClock: perUnit(week / HOURS_PER_WEEK, 24),
    atWork: perUnit(hourly, hoursPerWorkday),
    totals: { week, month, year },
  };
}

export interface EarnedToday {
  /** Pay earned since midnight at the around the clock rate. */
  aroundTheClock: number;
  /** Pay earned during today's working time at the hourly rate. */
  atWork: number;
  progress: WorkProgress;
}

export function calculateEarnedToday(
  settings: AffordiSettings,
  rates: EarningRates,
  now: Date,
): EarnedToday {
  const progress = workProgress(settings, now);
  return {
    aroundTheClock: (rates.totals.week / MS_PER_WEEK) * msSinceMidnight(now),
    atWork: (rates.atWork.hour / MS_PER_HOUR) * progress.workedMs,
    progress,
  };
}
