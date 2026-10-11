import {
  calculateIncomePercentage,
  calculateWorkHours,
  isPriceRepeat,
  paymentsPerYear,
  type IncomeSettings,
  type PriceRepeat,
} from './calculations';
import { isCurrencyCode, type CurrencyCode } from './locale';
import { readRecord, removeRecord, writeRecord } from './localStore';

export const CHECKS_STORAGE_KEY = 'affordi.checks.v1';
export const MAX_NAME_LENGTH = 60;
/** Keeps storage small; the oldest items drop off first. */
const MAX_SAVED_CHECKS = 100;

/** A price the person chose to keep, stored only on this device. */
export interface SavedCheck {
  id: string;
  name: string;
  price: number;
  repeat: PriceRepeat;
  currency: CurrencyCode;
  savedAt: number;
}

type UncheckedItem = Partial<Record<keyof SavedCheck, unknown>>;

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasValidText(item: UncheckedItem): boolean {
  return (
    typeof item.id === 'string' &&
    item.id !== '' &&
    typeof item.name === 'string' &&
    item.name.length <= MAX_NAME_LENGTH
  );
}

function isSavedCheck(value: unknown): value is SavedCheck {
  if (typeof value !== 'object' || value === null) return false;
  const item: UncheckedItem = value;
  return (
    hasValidText(item) &&
    isNonNegativeNumber(item.price) &&
    isPriceRepeat(item.repeat) &&
    isCurrencyCode(item.currency) &&
    isNonNegativeNumber(item.savedAt)
  );
}

/** Reads saved items defensively, newest first, skipping any malformed entry. */
export function loadChecks(): SavedCheck[] {
  const checks = readRecord(CHECKS_STORAGE_KEY, 'checks');
  if (!Array.isArray(checks)) return [];
  return checks.filter(isSavedCheck).slice(0, MAX_SAVED_CHECKS);
}

export function saveChecks(checks: readonly SavedCheck[]): boolean {
  return writeRecord(CHECKS_STORAGE_KEY, 'checks', checks.slice(0, MAX_SAVED_CHECKS));
}

export function clearChecks(): boolean {
  return removeRecord(CHECKS_STORAGE_KEY);
}

let sequence = 0;

/** Builds a new item with a trimmed name and an identifier unique on this device. */
export function createCheck(
  name: string,
  price: number,
  repeat: PriceRepeat,
  currency: CurrencyCode,
  now = Date.now(),
): SavedCheck {
  sequence += 1;
  return {
    id: `${now.toString(36)}${sequence.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    price,
    repeat,
    currency,
    savedAt: now,
  };
}

/** Adds an item to the front of the list, keeping the list within its size limit. */
export function addCheck(checks: readonly SavedCheck[], check: SavedCheck): SavedCheck[] {
  return [check, ...checks].slice(0, MAX_SAVED_CHECKS);
}

interface RecurringTotal {
  workHours: number;
  percentage: number;
}

/**
 * Work time and share of yearly pay for every recurring item in the current
 * currency, or null when there are none. Items in another currency are left
 * out because prices are never converted.
 */
export function recurringYearlyTotal(
  checks: readonly SavedCheck[],
  settings: IncomeSettings & { currency: CurrencyCode },
): RecurringTotal | null {
  let yearlyCost = 0;
  let count = 0;
  for (const check of checks) {
    if (check.repeat === 'once' || check.currency !== settings.currency) continue;
    yearlyCost += check.price * paymentsPerYear(check.repeat, settings.workingDaysPerWeek);
    count += 1;
  }
  if (count === 0) return null;

  const workHours = calculateWorkHours(yearlyCost, settings);
  const percentage = calculateIncomePercentage(yearlyCost, settings, 'yearly');
  if (workHours === null || percentage === null) return null;
  return { workHours, percentage };
}
