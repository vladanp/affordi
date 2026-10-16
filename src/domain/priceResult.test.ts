import { describe, expect, it } from 'vitest';

import { describeAnnouncement, describeResult, timeSettings } from './priceResult';
import type { AffordiSettings } from './storage';

const settings: AffordiSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  monthlySavings: 0,
  commuteMinutes: 0,
  monthlyWorkCosts: 0,
  currency: 'EUR',
  language: 'en',
  theme: 'system',
};

describe('describeResult', () => {
  it('returns null without a price', () => {
    expect(describeResult(null, 'once', 0, settings)).toBeNull();
  });

  it('splits a single purchase over its uses from two uses on', () => {
    const notes = (uses: number) =>
      describeResult(1_300, 'once', uses, settings)?.notes.map((note) => note.text);
    expect(notes(0)).toEqual([]);
    expect(notes(1)).toEqual([]);
    expect(notes(100)).toEqual(['Per use (100×): 45 minutes']);
    expect(notes(2_000)).toEqual(['Per use (2,000×): 2 minutes']);
    expect(describeResult(1_300, 'monthly', 100, settings)?.notes).toEqual([
      { kind: 'repeat', text: 'Over a year: 22 weeks and 3 days' },
    ]);
  });

  it('lists saving time before cost per use', () => {
    const result = describeResult(900, 'once', 10, { ...settings, monthlySavings: 300 });
    expect(result?.notes.map((note) => note.kind)).toEqual(['saving', 'use']);
  });

  it('measures time with the true wage but keeps the share of paid income', () => {
    const adjusted = { ...settings, commuteMinutes: 60, monthlyWorkCosts: 300 };
    const paid = describeResult(750, 'once', 0, settings);
    const real = describeResult(750, 'once', 0, adjusted);
    expect(paid?.primary).toBe('43 hours of work');
    expect(paid?.footnote).toBeNull();
    expect(real?.primary).toBe('54 hours of work');
    expect(real?.secondary).toBe('6 days');
    expect(real?.share).toBe(paid?.share);
    expect(real?.footnote).toBe('Includes your commute and work costs.');
    expect(describeAnnouncement(real!)).toBe(
      '€750.00 is 54 hours of work. ≈ 6 days. 25% of your monthly take home pay. Includes your commute and work costs.',
    );
  });

  it('falls back to the paid wage when stored costs are no longer possible', () => {
    const impossible = { ...settings, monthlyWorkCosts: 4_000 };
    expect(timeSettings(impossible)).toBe(impossible);
    expect(describeResult(750, 'once', 0, impossible)?.footnote).toBeNull();
  });
});
