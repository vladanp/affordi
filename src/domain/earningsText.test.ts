import { describe, expect, it } from 'vitest';

import {
  describeWorkStatus,
  formatProgress,
  formatRate,
  formatTicker,
  tickerDigits,
} from './earningsText';
import { createTranslator } from './i18n';
import { workProgress, type WorkSchedule } from './schedule';

const officeHours: WorkSchedule = { workStart: 540, workEnd: 1020, workDays: [1, 2, 3, 4, 5] };
/** Wednesday 21 October 2026 at a local time. */
const wednesday = (hours: number, minutes = 0) => new Date(2026, 9, 21, hours, minutes);

describe('live totals', () => {
  it('adds digits until the last one moves several times a second', () => {
    expect(tickerDigits(0.001_144_7, 'EUR', 'en')).toBe(4);
    expect(tickerDigits(0.038, 'RSD', 'sr')).toBe(3);
    expect(tickerDigits(0.5, 'USD', 'en')).toBe(2);
    expect(tickerDigits(12, 'USD', 'en')).toBe(2);
    expect(tickerDigits(1e-9, 'EUR', 'en')).toBe(6);
    expect(tickerDigits(0, 'EUR', 'en')).toBe(2);
  });

  it('splits the extra digits from the usual currency precision', () => {
    expect(formatTicker(49.450_549, 'EUR', 'en', 4)).toEqual({
      lead: '€49.45',
      extra: '05',
      trail: '',
    });
    expect(formatTicker(12_345.678_9, 'EUR', 'de', 4)).toEqual({
      lead: '12.345,67',
      extra: '89',
      trail: ' €',
    });
    expect(formatTicker(3.5, 'USD', 'en', 2)).toEqual({ lead: '$3.50', extra: '', trail: '' });
  });

  it('keeps the separator with the extra digits of a currency without fraction digits', () => {
    expect(formatTicker(29_052.2, 'JPY', 'en', 2)).toEqual({
      lead: '¥29,052',
      extra: '.20',
      trail: '',
    });
    expect(tickerDigits(0.34, 'JPY', 'en')).toBe(2);
    expect(tickerDigits(3, 'JPY', 'en')).toBe(1);
    expect(tickerDigits(30, 'JPY', 'en')).toBe(0);
  });

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
    expect(describeWorkStatus(workProgress(officeHours, wednesday(8)), en)).toBe(
      'Starts at 9:00 AM',
    );
    expect(describeWorkStatus(workProgress(officeHours, wednesday(13, 48)), en)).toBe(
      'Working until 5:00 PM · 3 hours and 12 minutes left',
    );
    expect(describeWorkStatus(workProgress(officeHours, wednesday(17)), en)).toBe(
      'Finished at 5:00 PM',
    );
    expect(describeWorkStatus(workProgress(officeHours, new Date(2026, 9, 25, 12)), en)).toBe(
      'No work today',
    );
  });

  it('shows the last seconds as one minute left', () => {
    const almostDone = new Date(2026, 9, 21, 16, 59, 30);
    expect(describeWorkStatus(workProgress(officeHours, almostDone), en)).toBe(
      'Working until 5:00 PM · 1 minute left',
    );
  });

  it.each([
    ['de', 'Arbeit bis 17:00 · Noch 3 Stunden und 12 Minuten'],
    ['fr', 'Au travail jusqu’à 17:00 · Encore 3 heures et 12 minutes'],
    ['it', 'Al lavoro fino alle 17:00 · Ancora 3 ore e 12 minuti'],
    ['sr', 'Radite do 17:00 · Još 3 sata i 12 minuta'],
  ] as const)('writes the time left in %s', (locale, expected) => {
    expect(
      describeWorkStatus(workProgress(officeHours, wednesday(13, 48)), createTranslator(locale)),
    ).toBe(expected);
  });
});
