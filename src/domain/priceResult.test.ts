import { describe, expect, it } from 'vitest';

import { describeAnnouncement, describeResult } from './priceResult';
import type { AffordiSettings } from './storage';

const settings: AffordiSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  currency: 'EUR',
  language: 'en',
  theme: 'system',
};

describe('describeResult', () => {
  it('returns null without a price', () => {
    expect(describeResult(null, 'once', settings)).toBeNull();
  });

  it('describes a single purchase without a repeat note', () => {
    const result = describeResult(750, 'once', settings);
    expect(result?.primary).toBe('43 hours of work');
    expect(result?.secondary).toBe('5 days and 3 hours');
    expect(result?.repeatNote).toBeNull();
    expect(describeAnnouncement(result!)).toBe(
      '€750.00 is 43 hours of work. ≈ 5 days and 3 hours. 25% of your monthly take home pay',
    );
  });

  it('adds the other period for recurring prices', () => {
    expect(describeResult(1_300, 'monthly', settings)?.repeatNote).toBe(
      'Over a year: 22 weeks and 3 days',
    );
    expect(describeResult(1_200, 'yearly', settings)?.repeatNote).toBe(
      'Each month: 5 hours and 47 minutes',
    );
    const workday = describeResult(4.5, 'workday', settings);
    expect(workday?.repeatNote).toBe('Over a year: 68 hours');
    expect(describeAnnouncement(workday!)).toBe(
      '€4.50 every workday is 16 minutes of work. Over a year: 68 hours. 3% of your monthly take home pay',
    );
  });
});
