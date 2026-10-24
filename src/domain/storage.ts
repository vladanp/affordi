import { isValidIncomeSettings, type IncomeSettings } from './calculations';
import { BILLS_STORAGE_KEY } from './bills';
import { FIXED_COSTS_STORAGE_KEY } from './fixedCosts';
import { detectLocale, isLocale, type Locale } from './i18n';
import { detectCurrency, isCurrencyCode, type CurrencyCode } from './locale';
import { readRecord, removeRecord, writeRecord } from './localStore';
import {
  isWorkSchedule,
  scheduleFromWeeklyHours,
  scheduleHours,
  type WorkSchedule,
} from './schedule';
import { isThemePreference, type ThemePreference } from './theme';

export const SETTINGS_STORAGE_KEY = 'affordi.settings.v1';
/** Saved items from earlier releases. Nothing reads them now, but a reset still erases them. */
const LEGACY_CHECKS_STORAGE_KEY = 'affordi.checks.v1';

/**
 * Weekly hours and work days come from the schedule. They are saved beside it,
 * so an older installed version that has not updated yet still reads them.
 */
export interface AffordiSettings extends IncomeSettings, WorkSchedule {
  currency: CurrencyCode;
  language: Locale;
  theme: ThemePreference;
  /** Whether the earnings page opens with its amounts hidden, as it was last left. */
  hideAmounts: boolean;
}

/** A schedule with the weekly hours and work days it implies. */
export function withScheduleHours(
  schedule: WorkSchedule,
): WorkSchedule & Pick<IncomeSettings, 'weeklyHours' | 'workingDaysPerWeek'> {
  return {
    workStart: schedule.workStart,
    workEnd: schedule.workEnd,
    workDays: schedule.workDays,
    ...scheduleHours(schedule),
  };
}

export function isValidAffordiSettings(value: unknown): value is AffordiSettings {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('currency' in value) ||
    !('language' in value) ||
    !('theme' in value) ||
    !('hideAmounts' in value)
  ) {
    return false;
  }

  if (!isWorkSchedule(value) || !isValidIncomeSettings(value)) return false;
  const implied = scheduleHours(value);
  return (
    isCurrencyCode(value.currency) &&
    isLocale(value.language) &&
    isThemePreference(value.theme) &&
    typeof value.hideAmounts === 'boolean' &&
    value.weeklyHours === implied.weeklyHours &&
    value.workingDaysPerWeek === implied.workingDaysPerWeek
  );
}

type OptionalSettings = Pick<AffordiSettings, 'language' | 'theme' | 'hideAmounts'>;

/**
 * Fields added after the first release fall back to defaults, so older saves stay
 * usable. Fields from removed features are dropped and disappear on the next save.
 */
function optionalSettings(value: object): OptionalSettings {
  return {
    language: 'language' in value && isLocale(value.language) ? value.language : detectLocale(),
    theme: 'theme' in value && isThemePreference(value.theme) ? value.theme : 'system',
    hideAmounts: 'hideAmounts' in value && value.hideAmounts === true,
  };
}

/** The saved schedule, or one built from the weekly hours of a save from before work times. */
function savedSchedule(value: object): WorkSchedule | null {
  if (isWorkSchedule(value)) return value;
  return scheduleFromWeeklyHours(
    'weeklyHours' in value ? value.weeklyHours : undefined,
    'workingDaysPerWeek' in value ? value.workingDaysPerWeek : undefined,
  );
}

function normalizeSettings(value: unknown): AffordiSettings | null {
  if (typeof value !== 'object' || value === null) return null;
  const schedule = savedSchedule(value);
  if (schedule === null) return null;

  const settings = {
    netIncome: 'netIncome' in value ? value.netIncome : undefined,
    payFrequency: 'payFrequency' in value ? value.payFrequency : undefined,
    ...withScheduleHours(schedule),
    currency: 'currency' in value ? value.currency : undefined,
    ...optionalSettings(value),
  };
  return isValidAffordiSettings(settings) ? settings : null;
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

/** Erases everything Affordi saved on this device: settings, fixed costs, bills, and old items. */
export function clearSettings(): boolean {
  return (
    removeRecord(LEGACY_CHECKS_STORAGE_KEY) &&
    removeRecord(FIXED_COSTS_STORAGE_KEY) &&
    removeRecord(BILLS_STORAGE_KEY) &&
    removeRecord(SETTINGS_STORAGE_KEY)
  );
}

export function defaultSettings(): AffordiSettings {
  return {
    netIncome: 3_000,
    payFrequency: 'monthly',
    ...withScheduleHours({ workStart: 9 * 60, workEnd: 17 * 60, workDays: [1, 2, 3, 4, 5] }),
    currency: detectCurrency(),
    language: detectLocale(),
    theme: 'system',
    hideAmounts: false,
  };
}
