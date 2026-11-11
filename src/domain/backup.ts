import { isBill, loadBills, MAX_BILLS, saveBills, type Bill } from './bills';
import {
  isFixedCost,
  loadFixedCosts,
  MAX_FIXED_COSTS,
  saveFixedCosts,
  type FixedCost,
} from './fixedCosts';
import {
  isValidAffordiSettings,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type AffordiSettings,
} from './storage';

export interface Backup {
  version: 1;
  settings: AffordiSettings;
  bills: Bill[];
  fixedCosts: FixedCost[];
}

function uniqueIds(items: readonly { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

/** Validate before offering replacement; never partially salvage an import without telling its owner. */
export function parseBackup(text: string): Backup | null {
  try {
    const value: unknown = JSON.parse(text);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('version' in value) ||
      value.version !== 1 ||
      !('settings' in value) ||
      !isValidAffordiSettings(value.settings) ||
      !('bills' in value) ||
      !Array.isArray(value.bills) ||
      value.bills.length > MAX_BILLS ||
      !value.bills.every(isBill) ||
      !uniqueIds(value.bills) ||
      !('fixedCosts' in value) ||
      !Array.isArray(value.fixedCosts) ||
      value.fixedCosts.length > MAX_FIXED_COSTS ||
      !value.fixedCosts.every(isFixedCost) ||
      !uniqueIds(value.fixedCosts)
    )
      return null;
    const settings = normalizeSettings(value.settings);
    if (settings === null) return null;
    return {
      version: 1,
      settings,
      bills: value.bills.map(({ id, name, entries }) => ({
        id,
        name,
        entries: entries.map(({ month, amount }) => ({ month, amount })),
      })),
      fixedCosts: value.fixedCosts.map(({ id, name, amount, firstPayment, lastPayment }) => ({
        id,
        name,
        amount,
        firstPayment,
        lastPayment,
      })),
    };
  } catch {
    return null;
  }
}

export function createBackup(): Backup | null {
  const settings = loadSettings();
  return settings === null
    ? null
    : { version: 1, settings, bills: loadBills(), fixedCosts: loadFixedCosts() };
}

/** Roll back the original records if any write fails (e.g. the browser's storage quota). */
function replaceRecords(backup: Backup): boolean {
  const keys = ['affordi.settings.v1', 'affordi.bills.v1', 'affordi.fixedCosts.v1'];
  const before = keys.map((key) => localStorage.getItem(key));
  if (saveBills(backup.bills) && saveFixedCosts(backup.fixedCosts) && saveSettings(backup.settings))
    return true;
  for (const [index, key] of keys.entries()) {
    const previous = before[index];
    try {
      if (previous === null || previous === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
    } catch {
      /* Keep the original export available to recover from a browser refusing all writes. */
    }
  }
  return false;
}

/** A browser refusing all access to local storage is a reported import failure. */
export function restoreBackup(backup: Backup): boolean {
  try {
    return replaceRecords(backup);
  } catch {
    return false;
  }
}
