import { currentLocale } from './locale';

function separatorsForLocale(locale: string): { decimal: string; group: string } {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12_345.6);
    return {
      decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
      group: parts.find((part) => part.type === 'group')?.value ?? ',',
    };
  } catch {
    return { decimal: '.', group: ',' };
  }
}

function containsOnlyDigits(value: string): boolean {
  if (value === '') return false;
  for (const character of value) {
    if (character < '0' || character > '9') return false;
  }
  return true;
}

function hasValidGrouping(value: string, group: string): boolean {
  const parts = value.split(group);
  if (parts.length < 2 || !parts.every(containsOnlyDigits)) return false;

  const western = parts[0]!.length <= 3 && parts.slice(1).every((part) => part.length === 3);
  const indian =
    parts.length > 2 &&
    parts[0]!.length <= 3 &&
    parts.at(-1)!.length === 3 &&
    parts.slice(1, -1).every((part) => part.length === 2);

  return western || indian;
}

function parseGrouped(value: string, group: string, decimal: string): number | null {
  const decimalParts = value.split(decimal);
  if (decimalParts.length > 2) return null;

  const [integerPart = '', fractionPart] = decimalParts;
  if (!hasValidGrouping(integerPart, group)) return null;
  if (fractionPart !== undefined && fractionPart !== '' && !containsOnlyDigits(fractionPart)) {
    return null;
  }

  const normalizedInteger = integerPart.split(group).join('');
  const normalized =
    fractionPart === undefined ? normalizedInteger : `${normalizedInteger}.${fractionPart}`;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Parses a decimal while preserving the original input string in the UI. */
export function parseDecimalInput(value: string, locale = currentLocale()): number | null {
  const { decimal, group } = separatorsForLocale(locale);
  const usesSpaceGrouping = group.trim() === '';
  const normalizedGroup = usesSpaceGrouping ? ' ' : group;
  const trimmed = value.trim().replace(/[\u00a0\u202f]/g, usesSpaceGrouping ? ' ' : '\u00a0');
  if (trimmed === '') return null;

  const allowedSeparators = new Set(['.', ',', normalizedGroup]);
  for (const character of trimmed) {
    const isDigit = character >= '0' && character <= '9';
    if (!isDigit && !allowedSeparators.has(character)) return null;
  }

  if (trimmed.includes(normalizedGroup)) {
    const grouped = parseGrouped(trimmed, normalizedGroup, decimal);
    if (grouped !== null) return grouped;

    // A single comma or period may be a decimal separator typed in a different locale.
    if (normalizedGroup !== '.' && normalizedGroup !== ',') return null;
  }

  const hasDot = trimmed.includes('.');
  const hasComma = trimmed.includes(',');
  if (hasDot && hasComma) return null;

  const separator = hasDot || hasComma ? (hasDot ? '.' : ',') : null;
  if (separator !== null) {
    const separatorIndex = trimmed.indexOf(separator);
    const integerPart = trimmed.slice(0, separatorIndex);
    const fractionPart = trimmed.slice(separatorIndex + 1);
    if (trimmed.indexOf(separator, separatorIndex + 1) !== -1) return null;
    if (integerPart === '' && fractionPart === '') return null;
  }

  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
