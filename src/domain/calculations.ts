export const payFrequencies = ['hourly', 'weekly', 'biweekly', 'monthly', 'yearly'] as const;

export type PayFrequency = (typeof payFrequencies)[number];

export interface IncomeSettings {
  netIncome: number;
  payFrequency: PayFrequency;
  weeklyHours: number;
  workingDaysPerWeek: number;
}

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isPayFrequency(value: unknown): value is PayFrequency {
  return typeof value === 'string' && payFrequencies.some((frequency) => frequency === value);
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
    settings.weeklyHours <= 168 &&
    typeof settings.workingDaysPerWeek === 'number' &&
    Number.isInteger(settings.workingDaysPerWeek) &&
    settings.workingDaysPerWeek >= 1 &&
    settings.workingDaysPerWeek <= 7
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

/** Returns the work time for a non-negative item price, or null for invalid input. */
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

/** Percentage of one configured pay period represented by the item price. */
export function calculateIncomePercentage(
  itemPrice: number,
  settings: IncomeSettings,
): number | null {
  if (!Number.isFinite(itemPrice) || itemPrice < 0 || !isValidIncomeSettings(settings)) {
    return null;
  }

  const percentage = (itemPrice / settings.netIncome) * 100;
  return Number.isFinite(percentage) ? percentage : null;
}

export function calculateHoursPerWorkday(settings: IncomeSettings): number | null {
  if (!isValidIncomeSettings(settings)) {
    return null;
  }

  return settings.weeklyHours / settings.workingDaysPerWeek;
}
