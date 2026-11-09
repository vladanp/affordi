import { describe, expect, it } from 'vitest';

import { formatDecimalInput, localizeDecimalInput, parseDecimalInput } from './input';

describe('parseDecimalInput', () => {
  it.each([
    ['750', 750],
    ['750.50', 750.5],
    ['750,50', 750.5],
    ['.5', 0.5],
    [',5', 0.5],
    ['12.', 12],
  ])('parses %s as %s without requiring formatted input', (raw, expected) => {
    expect(parseDecimalInput(raw)).toBe(expected);
  });

  it.each(['', ' ', '.', ',', '1,2,3', '1e3', '-2', '$10'])(
    'rejects incomplete or unsafe input %s',
    (raw) => {
      expect(parseDecimalInput(raw)).toBeNull();
    },
  );

  it.each(['1.000,50', '1,2,3', '1,000,50'])('rejects mixed or malformed separators %s', (raw) => {
    expect(parseDecimalInput(raw)).toBeNull();
  });

  it('interprets grouping according to locale and keeps decimal precision', () => {
    expect(parseDecimalInput('3,000', 'en-US')).toBe(3000);
    expect(parseDecimalInput('1,234,567', 'en-US')).toBe(1_234_567);
    expect(parseDecimalInput('12,34,567', 'en-IN')).toBe(1_234_567);
    expect(parseDecimalInput('3.000', 'de-DE')).toBe(3000);
    expect(parseDecimalInput('1.234.567', 'de-DE')).toBe(1_234_567);
    expect(parseDecimalInput('1.234,56', 'de-DE')).toBe(1234.56);
    expect(parseDecimalInput('1\u202f234,56', 'fr-FR')).toBe(1234.56);
    expect(parseDecimalInput('750,00', 'en-US')).toBe(750);
    expect(parseDecimalInput('750,00', 'de-DE')).toBe(750);
    expect(parseDecimalInput('3.125', 'en-US')).toBe(3.125);
    expect(parseDecimalInput('.5', 'en-US')).toBe(0.5);
    expect(parseDecimalInput(',5', 'de-DE')).toBe(0.5);
  });
});

describe('localized decimal drafts', () => {
  it('preserves an amount across grouping and decimal conventions', () => {
    expect(localizeDecimalInput('1,234.56', 'en', 'de')).toBe('1234,56');
    expect(localizeDecimalInput('1.234', 'de', 'en')).toBe('1234');
    expect(localizeDecimalInput('3.125', 'en', 'de')).toBe('3,125');
    expect(localizeDecimalInput('91.00', 'en', 'de', 2)).toBe('91,00');
  });

  it('leaves empty, invalid, and same-locale drafts as typed', () => {
    expect(localizeDecimalInput('', 'en', 'de')).toBe('');
    expect(localizeDecimalInput('1,2,3', 'en', 'de')).toBe('1,2,3');
    expect(localizeDecimalInput('1,234.00', 'en', 'en')).toBe('1,234.00');
  });

  it('does not round saved decimal values to six places on edit', () => {
    expect(formatDecimalInput(3.123456789, 'de')).toBe('3,123456789');
  });
});
