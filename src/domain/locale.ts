const fallbackCurrencies = [
  'USD',
  'EUR',
  'GBP',
  'RSD',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'INR',
  'BRL',
  'NZD',
  'SGD',
  'MXN',
  'ARS',
  'CLP',
  'COP',
  'ZAR',
  'TRY',
  'HKD',
] as const;

export type CurrencyCode = string;

export const supportedCurrencies: readonly string[] =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('currency')
    : fallbackCurrencies;
const supportedCurrencySet = new Set(supportedCurrencies);

/** Familiar currencies come first; every runtime-supported ISO code remains selectable. */
const familiarCurrencyOptions = fallbackCurrencies.filter((currency) =>
  supportedCurrencySet.has(currency),
);
const familiarCurrencySet: Set<string> = new Set(familiarCurrencyOptions);
const otherCurrencyOptions = supportedCurrencies
  .filter((currency) => !familiarCurrencySet.has(currency))
  .toSorted((left, right) => left.localeCompare(right));
export const currencyOptions = [...new Set([...familiarCurrencyOptions, ...otherCurrencyOptions])];

const currencyByRegion: Record<string, CurrencyCode> = {
  AU: 'AUD',
  CA: 'CAD',
  CH: 'CHF',
  CN: 'CNY',
  GB: 'GBP',
  JP: 'JPY',
  BR: 'BRL',
  CZ: 'CZK',
  DK: 'DKK',
  IN: 'INR',
  NO: 'NOK',
  NZ: 'NZD',
  PL: 'PLN',
  RS: 'RSD',
  SE: 'SEK',
  SG: 'SGD',
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
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  HK: 'HKD',
  ID: 'IDR',
  IL: 'ILS',
  KR: 'KRW',
  MX: 'MXN',
  RU: 'RUB',
  SA: 'SAR',
  TH: 'THB',
  TR: 'TRY',
  UA: 'UAH',
  AE: 'AED',
  ZA: 'ZAR',
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
  return typeof value === 'string' && supportedCurrencies.includes(value);
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
    return `${currency} ${value.toFixed(currency === 'JPY' ? 0 : 2)}`;
  }
}
