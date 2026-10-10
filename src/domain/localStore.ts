/** Small helpers for versioned JSON records in local storage that never throw. */

const RECORD_VERSION = 1;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Returns the named field of a version 1 record, or null when it is missing or malformed. */
export function readRecord(key: string, field: string): unknown {
  try {
    const raw = storage()?.getItem(key) ?? null;
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== RECORD_VERSION ||
      !(field in parsed)
    ) {
      return null;
    }
    const value: unknown = Reflect.get(parsed, field);
    return value;
  } catch {
    return null;
  }
}

export function writeRecord(key: string, field: string, value: unknown): boolean {
  const currentStorage = storage();
  if (currentStorage === null) {
    return false;
  }

  try {
    currentStorage.setItem(key, JSON.stringify({ version: RECORD_VERSION, [field]: value }));
    return true;
  } catch {
    return false;
  }
}

export function removeRecord(key: string): boolean {
  const currentStorage = storage();
  if (currentStorage === null) {
    return false;
  }

  try {
    currentStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
