export const payFrequencies = ['hourly', 'weekly', 'biweekly', 'monthly', 'yearly'] as const;

export type PayFrequency = (typeof payFrequencies)[number];

/** How often a price is paid. Recurring prices compare with income over a matching period. */
export const priceRepeats = ['once', 'workday', 'weekly', 'monthly', 'yearly'] as const;

export type PriceRepeat = (typeof priceRepeats)[number];
export type RecurringRepeat = Exclude<PriceRepeat, 'once'>;

export interface IncomeSettings {
  netIncome: number;
  payFrequency: PayFrequency;
  weeklyHours: number;
  workingDaysPerWeek: number;
}

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const PAY_PERIODS_PER_YEAR: Record<Exclude<PayFrequency, 'hourly'>, number> = {
  weekly: WEEKS_PER_YEAR,
  biweekly: WEEKS_PER_YEAR / 2,
  monthly: MONTHS_PER_YEAR,
  yearly: 1,
};
export const MAX_WEEKLY_HOURS = 168;
export const MAX_HOURS_PER_WORKDAY = 24;

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isPayFrequency(value: unknown): value is PayFrequency {
  return typeof value === 'string' && payFrequencies.some((frequency) => frequency === value);
}

export function isPriceRepeat(value: unknown): value is PriceRepeat {
  return typeof value === 'string' && priceRepeats.some((repeat) => repeat === value);
}

/** A whole number of working days in one week. */
export function isWorkingDayCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

export function isValidIncomeSettings(settings: unknown): settings is IncomeSettings {
  if (
    typeof settings !== 'object' ||
    settings === null ||
    !('netIncome' in settings) ||
    !('payFrequency' in settings) ||
    !('weeklyHours' in settings) ||
    !('workingDaysPerWeek' in settings)
  ) {
    return false;
  }

  return (
    isFinitePositive(settings.netIncome) &&
    isPayFrequency(settings.payFrequency) &&
    isFinitePositive(settings.weeklyHours) &&
    settings.weeklyHours <= MAX_WEEKLY_HOURS &&
    isWorkingDayCount(settings.workingDaysPerWeek)
  );
}

/** Returns the configured net income as an hourly rate, or null for invalid input. */
export function calculateHourlyRate(settings: IncomeSettings): number | null {
  if (!isValidIncomeSettings(settings)) {
    return null;
  }

  const { netIncome, payFrequency, weeklyHours } = settings;
  let hourlyRate: number;

  switch (payFrequency) {
    case 'hourly':
      hourlyRate = netIncome;
      break;
    case 'weekly':
      hourlyRate = netIncome / weeklyHours;
      break;
    case 'biweekly':
      hourlyRate = netIncome / (weeklyHours * 2);
      break;
    case 'monthly':
      hourlyRate = (netIncome * MONTHS_PER_YEAR) / (WEEKS_PER_YEAR * weeklyHours);
      break;
    case 'yearly':
      hourlyRate = netIncome / (WEEKS_PER_YEAR * weeklyHours);
      break;
  }

  return isFinitePositive(hourlyRate) ? hourlyRate : null;
}

/** Returns the work time for an item price of zero or more, or null for invalid input. */
export function calculateWorkHours(itemPrice: number, settings: IncomeSettings): number | null {
  if (!Number.isFinite(itemPrice) || itemPrice < 0) {
    return null;
  }

  const hourlyRate = calculateHourlyRate(settings);
  if (hourlyRate === null) {
    return null;
  }

  const workHours = itemPrice / hourlyRate;
  return Number.isFinite(workHours) ? workHours : null;
}

/**
 * The pay period used for the share of income context. A single hour of pay is
 * too small to be a useful comparison, so hourly pay is compared with a week.
 */
export function incomeComparisonPeriod(payFrequency: PayFrequency): PayFrequency {
  return payFrequency === 'hourly' ? 'weekly' : payFrequency;
}

function periodsPerYear(period: PayFrequency, weeklyHours: number): number {
  return period === 'hourly' ? WEEKS_PER_YEAR * weeklyHours : PAY_PERIODS_PER_YEAR[period];
}

/** Net income earned over one period of any length, or null for invalid input. */
export function calculatePeriodIncome(
  settings: IncomeSettings,
  period: PayFrequency,
): number | null {
  if (!isValidIncomeSettings(settings)) {
    return null;
  }

  const { netIncome, payFrequency, weeklyHours } = settings;
  if (period === payFrequency) {
    return netIncome;
  }
  if (payFrequency === 'hourly' && period === 'weekly') {
    return netIncome * weeklyHours;
  }

  const income =
    (netIncome * periodsPerYear(payFrequency, weeklyHours)) / periodsPerYear(period, weeklyHours);
  return isFinitePositive(income) ? income : null;
}

/**
 * Percentage of one period of income represented by the item price. The period
 * defaults to the comparison pay period; recurring prices pass their own period.
 */
export function calculateIncomePercentage(
  itemPrice: number,
  settings: IncomeSettings,
  period: PayFrequency = incomeComparisonPeriod(settings.payFrequency),
): number | null {
  if (!Number.isFinite(itemPrice) || itemPrice < 0) {
    return null;
  }

  const periodIncome = calculatePeriodIncome(settings, period);
  if (periodIncome === null) {
    return null;
  }

  const percentage = (itemPrice / periodIncome) * 100;
  return Number.isFinite(percentage) ? percentage : null;
}

/** How many times a recurring price is paid in one year. */
export function paymentsPerYear(repeat: RecurringRepeat, workingDaysPerWeek: number): number {
  return repeat === 'workday' ? workingDaysPerWeek * WEEKS_PER_YEAR : PAY_PERIODS_PER_YEAR[repeat];
}

interface PriceComparison {
  amount: number;
  period: PayFrequency;
}

/**
 * The income period a price is compared with, and the price over that period.
 * Workday costs read best against a month, so they are scaled to one month.
 */
export function priceComparison(
  price: number,
  repeat: PriceRepeat,
  settings: IncomeSettings,
): PriceComparison {
  if (repeat === 'once') {
    return { amount: price, period: incomeComparisonPeriod(settings.payFrequency) };
  }
  if (repeat === 'workday') {
    const perYear = paymentsPerYear(repeat, settings.workingDaysPerWeek);
    return { amount: (price * perYear) / MONTHS_PER_YEAR, period: 'monthly' };
  }
  return { amount: price, period: repeat };
}

/** Months of saving needed for a price, or null when there is nothing to save for. */
export function calculateSavingMonths(itemPrice: number, monthlySavings: number): number | null {
  if (!isFinitePositive(itemPrice) || !isFinitePositive(monthlySavings)) {
    return null;
  }

  const months = itemPrice / monthlySavings;
  return isFinitePositive(months) ? months : null;
}

export function calculateHoursPerWorkday(settings: IncomeSettings): number | null {
  if (!isValidIncomeSettings(settings)) {
    return null;
  }

  return settings.weeklyHours / settings.workingDaysPerWeek;
}
