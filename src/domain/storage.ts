import { isValidIncomeSettings, type IncomeSettings } from './calculations';
import { detectLocale, isLocale, type Locale } from './i18n';
import { detectCurrency, isCurrencyCode, type CurrencyCode } from './locale';
import { isThemePreference, type ThemePreference } from './theme';

export const SETTINGS_STORAGE_KEY = 'affordi.settings.v1';

export interface AffordiSettings extends IncomeSettings {
  currency: CurrencyCode;
  language: Locale;
  theme: ThemePreference;
}

interface PersistedSettings {
  version: 1;
  settings: AffordiSettings;
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
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
    isValidIncomeSettings(value)
  );
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

  const language =
    'language' in value && isLocale(value.language) ? value.language : detectLocale();
  const theme = 'theme' in value && isThemePreference(value.theme) ? value.theme : 'system';
  return {
    netIncome: value.netIncome,
    payFrequency: value.payFrequency,
    weeklyHours: value.weeklyHours,
    workingDaysPerWeek: value.workingDaysPerWeek,
    currency: value.currency,
    language,
    theme,
  };
}

/** Reads settings defensively. Any malformed value is treated as a first visit. */
export function loadSettings(): AffordiSettings | null {
  const currentStorage = storage();
  if (currentStorage === null) {
    return null;
  }

  try {
    const raw = currentStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('settings' in parsed)
    ) {
      return null;
    }

    return normalizeSettings(parsed.settings);
  } catch {
    return null;
  }
}

export function saveSettings(settings: AffordiSettings): boolean {
  if (!isValidAffordiSettings(settings)) {
    return false;
  }

  const currentStorage = storage();
  if (currentStorage === null) {
    return false;
  }

  const value: PersistedSettings = { version: 1, settings };
  try {
    currentStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearSettings(): boolean {
  const currentStorage = storage();
  if (currentStorage === null) {
    return false;
  }

  try {
    currentStorage.removeItem(SETTINGS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function defaultSettings(): AffordiSettings {
  return {
    netIncome: 3_000,
    payFrequency: 'monthly',
    weeklyHours: 40,
    workingDaysPerWeek: 5,
    currency: detectCurrency(),
    language: detectLocale(),
    theme: 'system',
  };
}
