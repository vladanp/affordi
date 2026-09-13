import { describe, expect, it } from 'vitest';

import { parseDecimalInput } from './input';

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
