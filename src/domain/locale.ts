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

const currencyFormats = new Map<string, Intl.NumberFormat | null>();

function currencyFormat(currency: CurrencyCode, locale: string): Intl.NumberFormat | null {
  const key = `${locale}|${currency}`;
  let format = currencyFormats.get(key);
  if (format === undefined) {
    try {
      format = new Intl.NumberFormat(locale, { style: 'currency', currency });
    } catch {
      format = null;
    }
    currencyFormats.set(key, format);
  }
  return format;
}

/** The fraction digits a currency's amounts show, such as 2 for euros. */
export function currencyDigits(currency: CurrencyCode, locale = currentLocale()): number {
  return currencyFormat(currency, locale)?.resolvedOptions().maximumFractionDigits ?? 2;
}

export function getCurrencySymbol(currency: CurrencyCode, locale = currentLocale()): string {
  const symbol = currencyFormat(currency, locale)
    ?.formatToParts(0)
    .find((part) => part.type === 'currency')?.value;
  return symbol ?? currency;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  locale = currentLocale(),
): string {
  return currencyFormat(currency, locale)?.format(value) ?? `${currency} ${value.toFixed(2)}`;
}
