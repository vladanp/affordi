import { describe, expect, it } from 'vitest';

import { describeWorkStatus, formatEarned, formatProgress, formatRate } from './earningsText';
import { createTranslator } from './i18n';
import { workProgress, type WorkSchedule } from './schedule';

const officeHours: WorkSchedule = { workStart: 540, workEnd: 1020, workDays: [1, 2, 3, 4, 5] };
/** Wednesday 21 October 2026 at a local time. */
const wednesday = (hours: number, minutes = 0) => new Date(2026, 9, 21, hours, minutes);

describe('rates', () => {
  it('formats rates with two significant digits and at least the usual precision', () => {
    expect(formatRate(1.44, 'JPY', 'en')).toBe('¥1.4');
    expect(formatRate(0.34, 'JPY', 'en')).toBe('¥0.34');
    expect(formatRate(87.2, 'JPY', 'en')).toBe('¥87');
    expect(formatRate(1e-9, 'EUR', 'en')).toBe('€0.000000');
    expect(formatRate(0.001_144_7, 'EUR', 'en')).toBe('€0.0011');
    expect(formatRate(0.068_68, 'EUR', 'en')).toBe('€0.069');
    expect(formatRate(4.120_879, 'EUR', 'en')).toBe('€4.12');
    expect(formatRate(36_000, 'EUR', 'de')).toBe('36.000,00 €');
  });
});

describe('month progress', () => {
  it('writes the month so far in the usual precision, rounded down', () => {
    expect(formatEarned(1_998.579_5, 'EUR', 'en')).toBe('€1,998.57');
    expect(formatEarned(1_998.579_5, 'EUR', 'de')).toBe('1.998,57\u00a0€');
    expect(formatEarned(0.29, 'EUR', 'en')).toBe('€0.29');
    expect(formatEarned(3_000, 'EUR', 'en')).toBe('€3,000.00');
    expect(formatEarned(29_052.9, 'JPY', 'en')).toBe('¥29,052');
  });

  it('rounds down to whole percentages in each language', () => {
    expect(formatProgress(115 / 176, 'en')).toBe('65%');
    expect(formatProgress(115 / 176, 'de')).toBe('65\u00a0%');
    expect(formatProgress(0.999, 'en')).toBe('99%');
    expect(formatProgress(1, 'en')).toBe('100%');
    expect(formatProgress(0.29, 'en')).toBe('29%');
    expect(formatProgress(0, 'it')).toBe('0%');
  });
});

describe('work status', () => {
  const en = createTranslator('en');

  it('describes each part of a work day', () => {
    expect(describeWorkStatus(workProgress(officeHours, wednesday(8)), en)).toEqual([
      'Starts at 9:00 AM',
    ]);
    expect(describeWorkStatus(workProgress(officeHours, wednesday(13, 48)), en)).toEqual([
      'Working until 5:00 PM',
      '3 hours and 12 minutes left',
    ]);
    expect(describeWorkStatus(workProgress(officeHours, wednesday(17)), en)).toEqual([
      'Finished at 5:00 PM',
    ]);
    expect(describeWorkStatus(workProgress(officeHours, new Date(2026, 9, 25, 12)), en)).toEqual([
      'No work today',
    ]);
  });

  it('shows the last seconds as one minute left', () => {
    const almostDone = new Date(2026, 9, 21, 16, 59, 30);
    expect(describeWorkStatus(workProgress(officeHours, almostDone), en)).toEqual([
      'Working until 5:00 PM',
      '1 minute left',
    ]);
  });

  it.each([
    ['de', 'Arbeit bis 17:00', 'Noch 3 Stunden und 12 Minuten'],
    ['fr', 'Au travail jusqu’à 17:00', 'Encore 3 heures et 12 minutes'],
    ['it', 'Al lavoro fino alle 17:00', 'Ancora 3 ore e 12 minuti'],
    ['sr', 'Radite do 17:00', 'Još 3 sata i 12 minuta'],
  ] as const)('writes the time left in %s', (locale, status, timeLeft) => {
    expect(
      describeWorkStatus(workProgress(officeHours, wednesday(13, 48)), createTranslator(locale)),
    ).toEqual([status, timeLeft]);
  });
});
