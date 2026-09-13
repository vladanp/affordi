export const currencyOptions = ['EUR', 'USD', 'RSD'] as const;

export type CurrencyCode = (typeof currencyOptions)[number];

const currencyByRegion: Record<string, CurrencyCode> = {
  RS: 'RSD',
  US: 'USD',
  AT: 'EUR',
  BE: 'EUR',
  DE: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GR: 'EUR',
  HR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
};

const currencyByLanguage: Record<string, CurrencyCode> = {
  de: 'EUR',
  es: 'EUR',
  fi: 'EUR',
  fr: 'EUR',
  hr: 'EUR',
  it: 'EUR',
  nl: 'EUR',
  pt: 'EUR',
  sr: 'RSD',
};

function regionForLocale(locale: string): string | null {
  try {
    const region = new Intl.Locale(locale).region;
    return region ?? null;
  } catch {
    return null;
  }
}

function languageForLocale(locale: string): string | null {
  try {
    return new Intl.Locale(locale).language;
  } catch {
    return null;
  }
}

export function detectCurrency(locale?: string): CurrencyCode {
  const candidate = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const regionCurrency = regionForLocale(candidate);

  if (regionCurrency !== null && currencyByRegion[regionCurrency] !== undefined)
    return currencyByRegion[regionCurrency];

  const language = languageForLocale(candidate);
  if (language !== null && currencyByLanguage[language] !== undefined)
    return currencyByLanguage[language];

  return 'USD';
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && currencyOptions.some((currency) => currency === value);
}

export function currentLocale(): string {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
}

export function getCurrencySymbol(currency: CurrencyCode, locale?: string): string {
  const resolvedLocale = locale ?? currentLocale();

  try {
    const symbol = new Intl.NumberFormat(resolvedLocale, { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value;
    return symbol ?? currency;
  } catch {
    return currency;
  }
}

export function formatCurrency(value: number, currency: CurrencyCode, locale?: string): string {
  const resolvedLocale = locale ?? currentLocale();

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
