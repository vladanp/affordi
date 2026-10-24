import { describe, expect, it } from 'vitest';

import { calculateEarnedThisMonth, calculateEarnedToday, calculateEarningRates } from './earnings';
import type { AffordiSettings } from './storage';

const settings: AffordiSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  workStart: 540,
  workEnd: 1020,
  workDays: [1, 2, 3, 4, 5],
  currency: 'EUR',
  language: 'en',
  theme: 'system',
};
const weeklyPay = (3_000 * 12) / 52;
/** Wednesday 21 October 2026 at a local time. */
const wednesday = (hours: number, minutes = 0) => new Date(2026, 9, 21, hours, minutes);

describe('earning rates', () => {
  it('spreads one week of pay over every hour of the week or over working time', () => {
    const rates = calculateEarningRates(settings);
    expect(rates).not.toBeNull();
    const clockHourly = weeklyPay / 168;
    expect(rates!.aroundTheClock.second).toBeCloseTo(clockHourly / 3_600, 12);
    expect(rates!.aroundTheClock.minute).toBeCloseTo(clockHourly / 60, 12);
    expect(rates!.aroundTheClock.hour).toBeCloseTo(4.120_879, 6);
    expect(rates!.aroundTheClock.day).toBeCloseTo(weeklyPay / 7, 10);
    expect(rates!.atWork.second).toBeCloseTo(weeklyPay / 40 / 3_600, 12);
    expect(rates!.atWork.minute).toBeCloseTo(weeklyPay / 40 / 60, 12);
    expect(rates!.atWork.hour).toBeCloseTo(17.307_692, 6);
    expect(rates!.atWork.day).toBeCloseTo(weeklyPay / 5, 10);
    expect(rates!.totals).toEqual({ week: weeklyPay, month: 3_000, year: 36_000 });
  });

  it('uses the hourly rate and weekly hours for hourly pay', () => {
    const rates = calculateEarningRates({ ...settings, netIncome: 25, payFrequency: 'hourly' });
    expect(rates!.atWork.hour).toBe(25);
    expect(rates!.atWork.day).toBe(200);
    expect(rates!.totals.week).toBe(1_000);
    expect(rates!.totals.year).toBe(52_000);
    expect(rates!.aroundTheClock.day).toBeCloseTo(1_000 / 7, 10);
  });

  it('returns null for invalid settings', () => {
    expect(calculateEarningRates({ ...settings, netIncome: 0 })).toBeNull();
  });
});

describe('earned today', () => {
  const rates = calculateEarningRates(settings)!;

  it('counts from midnight around the clock and during working time at work', () => {
    const noon = calculateEarnedToday(settings, rates, wednesday(12));
    expect(noon.aroundTheClock).toBeCloseTo(weeklyPay / 14, 10);
    expect(noon.atWork).toBeCloseTo((weeklyPay / 40) * 3, 10);
    expect(noon.progress.state).toBe('working');
  });

  it('holds the work total outside working time', () => {
    expect(calculateEarnedToday(settings, rates, wednesday(8)).atWork).toBe(0);
    expect(calculateEarnedToday(settings, rates, wednesday(20)).atWork).toBeCloseTo(
      weeklyPay / 5,
      10,
    );
    const saturday = calculateEarnedToday(settings, rates, new Date(2026, 9, 24, 12));
    expect(saturday.atWork).toBe(0);
    expect(saturday.aroundTheClock).toBeCloseTo(weeklyPay / 14, 10);
  });

  it('starts again at midnight', () => {
    expect(calculateEarnedToday(settings, rates, wednesday(0)).aroundTheClock).toBe(0);
  });
});

describe('earned this month', () => {
  const rates = calculateEarningRates(settings)!;

  it('moves toward the month’s pay with the work done so far', () => {
    const noon = calculateEarnedThisMonth(settings, rates, wednesday(12));
    expect(noon.share).toBeCloseTo(115 / 176, 12);
    expect(noon.amount).toBeCloseTo((3_000 * 115) / 176, 10);
    expect(noon).toMatchObject({ workdaysDone: 14, workdaysTotal: 22 });
  });

  it('holds still outside work and reaches the full month after the last workday', () => {
    const evening = calculateEarnedThisMonth(settings, rates, wednesday(20));
    expect(calculateEarnedThisMonth(settings, rates, wednesday(23)).amount).toBe(evening.amount);
    const monthEnd = calculateEarnedThisMonth(settings, rates, new Date(2026, 9, 31, 12));
    expect(monthEnd.share).toBe(1);
    expect(monthEnd.amount).toBe(3_000);
    expect(calculateEarnedThisMonth(settings, rates, new Date(2026, 9, 1, 8)).amount).toBe(0);
  });
});
