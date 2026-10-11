import { isValidIncomeSettings, type IncomeSettings } from './calculations';
import { detectLocale, isLocale, type Locale } from './i18n';
import { detectCurrency, isCurrencyCode, type CurrencyCode } from './locale';
import { readRecord, removeRecord, writeRecord } from './localStore';
import { isThemePreference, type ThemePreference } from './theme';

export const SETTINGS_STORAGE_KEY = 'affordi.settings.v1';

export interface AffordiSettings extends IncomeSettings {
  currency: CurrencyCode;
  language: Locale;
  /** Amount saved each month in the selected currency. Zero turns the saving time off. */
  monthlySavings: number;
  theme: ThemePreference;
}

/** Zero or a finite positive amount; zero means no monthly savings were entered. */
function isMonthlySavings(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isValidAffordiSettings(value: unknown): value is AffordiSettings {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('currency' in value) ||
    !('language' in value) ||
    !('monthlySavings' in value) ||
    !('theme' in value)
  ) {
    return false;
  }

  return (
    isCurrencyCode(value.currency) &&
    isLocale(value.language) &&
    isMonthlySavings(value.monthlySavings) &&
    isThemePreference(value.theme) &&
    isValidIncomeSettings(value)
  );
}

type OptionalSettings = Pick<AffordiSettings, 'language' | 'monthlySavings' | 'theme'>;

/** Fields added after the first release fall back to defaults, so older saves stay usable. */
function optionalSettings(value: object): OptionalSettings {
  return {
    language: 'language' in value && isLocale(value.language) ? value.language : detectLocale(),
    monthlySavings:
      'monthlySavings' in value && isMonthlySavings(value.monthlySavings)
        ? value.monthlySavings
        : 0,
    theme: 'theme' in value && isThemePreference(value.theme) ? value.theme : 'system',
  };
}

function normalizeSettings(value: unknown): AffordiSettings | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('currency' in value) ||
    !isCurrencyCode(value.currency) ||
    !isValidIncomeSettings(value)
  ) {
    return null;
  }

  return {
    netIncome: value.netIncome,
    payFrequency: value.payFrequency,
    weeklyHours: value.weeklyHours,
    workingDaysPerWeek: value.workingDaysPerWeek,
    currency: value.currency,
    ...optionalSettings(value),
  };
}

/** Reads settings defensively. Any malformed value is treated as a first visit. */
export function loadSettings(): AffordiSettings | null {
  return normalizeSettings(readRecord(SETTINGS_STORAGE_KEY, 'settings'));
}

export function saveSettings(settings: AffordiSettings): boolean {
  return (
    isValidAffordiSettings(settings) && writeRecord(SETTINGS_STORAGE_KEY, 'settings', settings)
  );
}

export function clearSettings(): boolean {
  return removeRecord(SETTINGS_STORAGE_KEY);
}

export function defaultSettings(): AffordiSettings {
  return {
    netIncome: 3_000,
    payFrequency: 'monthly',
    weeklyHours: 40,
    workingDaysPerWeek: 5,
    currency: detectCurrency(),
    language: detectLocale(),
    monthlySavings: 0,
    theme: 'system',
  };
}
