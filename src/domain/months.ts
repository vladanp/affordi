const MONTHS_PER_YEAR = 12;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** A calendar month with its month counted from 1 for January. */
export interface CalendarMonth {
  year: number;
  month: number;
}

/** Reads a month saved as YYYY-MM. */
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

function fromMonthNumber(number: number): CalendarMonth {
  return { year: Math.floor(number / MONTHS_PER_YEAR), month: (number % MONTHS_PER_YEAR) + 1 };
}

export function monthOf(date: Date): CalendarMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** The first day of a month, for formatting it as a month and year. */
export function monthStart({ year, month }: CalendarMonth): Date {
  return new Date(year, month - 1, 1);
}

/** How many months `later` comes after `earlier`, negative when it comes before. */
export function monthsAfter(later: CalendarMonth, earlier: CalendarMonth): number {
  return monthNumber(later) - monthNumber(earlier);
}

/** Whether a month came before the month of `now`. */
export function isMonthBefore(month: CalendarMonth, now: Date): boolean {
  return monthNumber(month) < monthNumber(monthOf(now));
}

/** The `count` months that end with the month of `now`, oldest first. */
export function recentMonths(now: Date, count: number): CalendarMonth[] {
  const last = monthNumber(monthOf(now));
  return Array.from({ length: count }, (_, index) => fromMonthNumber(last - count + 1 + index));
}
