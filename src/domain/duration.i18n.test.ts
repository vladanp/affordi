import { describe, expect, it } from 'vitest';

import { formatPrimaryDuration, formatWorkDuration } from './duration';

const settings = {
  netIncome: 3_000,
  payFrequency: 'monthly' as const,
  weeklyHours: 40,
  workingDaysPerWeek: 5,
};

describe('localized duration formatting', () => {
  it.each([
    ['de', '2 Stunden und 35 Minuten'],
    ['fr', '2 heures et 35 minutes'],
    ['it', '2 ore e 35 minuti'],
    ['sr', '2 sata i 35 minuta'],
  ] as const)('formats sub-day work in %s', (language, expected) => {
    expect(formatWorkDuration(2 + 35 / 60, settings, language)).toBe(expected);
  });

  it.each([
    ['de', '1 Tag und 4 Stunden'],
    ['fr', '1 jour et 4 heures'],
    ['it', '1 giorno e 4 ore'],
    ['sr', '1 dan i 4 sata'],
  ] as const)('uses plain day wording in %s', (language, expected) => {
    expect(formatWorkDuration(12, settings, language)).toBe(expected);
  });

  it.each([
    ['de', '8 Stunden Arbeitszeit'],
    ['fr', '8 heures de travail'],
    ['it', '8 ore di lavoro'],
    ['sr', '8 sati rada'],
  ] as const)('formats the primary workday result in %s', (language, expected) => {
    expect(formatPrimaryDuration(8, settings, language)).toBe(expected);
  });

  it('translates long durations and the less than minute boundary', () => {
    expect(formatWorkDuration(0.001, settings, 'fr')).toBe('Moins d’une minute');
    expect(formatPrimaryDuration(80, settings, 'it')).toBe('2 settimane');
    expect(formatWorkDuration(40_000_000, settings, 'sr')).toBe('Više od 999.999 nedelja');
  });
});
