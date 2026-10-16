import {
  isValidIncomeSettings,
  MAX_COMMUTE_MINUTES,
  type IncomeSettings,
  type WorkCosts,
} from './calculations';
import { detectLocale, isLocale, type Locale } from './i18n';
import { detectCurrency, isCurrencyCode, type CurrencyCode } from './locale';
import { readRecord, removeRecord, writeRecord } from './localStore';
import { isThemePreference, type ThemePreference } from './theme';

export const SETTINGS_STORAGE_KEY = 'affordi.settings.v1';

export interface AffordiSettings extends IncomeSettings, WorkCosts {
  currency: CurrencyCode;
  language: Locale;
  /** Amount saved each month in the selected currency. Zero turns the saving time off. */
  monthlySavings: number;
  theme: ThemePreference;
}

/** Zero or a finite positive amount; zero means the optional value was not entered. */
function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Optional amounts added after the first release, each with its own check. */
const optionalAmounts = {
  monthlySavings: isAmount,
  commuteMinutes: (value: unknown): value is number =>
    isAmount(value) && value <= MAX_COMMUTE_MINUTES,
  monthlyWorkCosts: isAmount,
} as const;

type OptionalAmount = keyof typeof optionalAmounts;
const optionalAmountKeys = [
  'monthlySavings',
  'commuteMinutes',
  'monthlyWorkCosts',
] as const satisfies readonly OptionalAmount[];

function readAmount(value: object, key: OptionalAmount): number {
  const amount: unknown = Reflect.get(value, key);
  return optionalAmounts[key](amount) ? amount : 0;
}

export function isValidAffordiSettings(value: unknown): value is AffordiSettings {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('currency' in value) ||
    !('language' in value) ||
    !('theme' in value)
  ) {
    return false;
  }

  return (
    isCurrencyCode(value.currency) &&
    isLocale(value.language) &&
    isThemePreference(value.theme) &&
    optionalAmountKeys.every(
      (key) => key in value && optionalAmounts[key](Reflect.get(value, key)),
    ) &&
    isValidIncomeSettings(value)
  );
}

type OptionalSettings = Pick<AffordiSettings, 'language' | 'theme' | OptionalAmount>;

/** Fields added after the first release fall back to defaults, so older saves stay usable. */
function optionalSettings(value: object): OptionalSettings {
  return {
    language: 'language' in value && isLocale(value.language) ? value.language : detectLocale(),
    monthlySavings: readAmount(value, 'monthlySavings'),
    commuteMinutes: readAmount(value, 'commuteMinutes'),
    monthlyWorkCosts: readAmount(value, 'monthlyWorkCosts'),
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
    commuteMinutes: 0,
    monthlyWorkCosts: 0,
    theme: 'system',
  };
}
