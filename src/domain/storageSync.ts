/** Rebase this tab's edits onto the newest saved record. Unedited fields belong to the newest tab. */
export function mergeChanges<T extends object>(base: T, next: T, latest: T): T {
  const merged = { ...latest };
  for (const key of new Set([...Object.keys(base), ...Object.keys(next)])) {
    if (JSON.stringify(Reflect.get(next, key)) === JSON.stringify(Reflect.get(base, key))) continue;
    if (Object.hasOwn(next, key)) Reflect.set(merged, key, Reflect.get(next, key));
    else Reflect.deleteProperty(merged, key);
  }
  return merged;
}

/** Keep concurrent additions and edits, and apply only deletions made against this tab's base. */
export function mergeList<T extends { id: string }>(
  base: readonly T[],
  next: readonly T[],
  latest: readonly T[],
  merge: (base: T, next: T, latest: T) => T = mergeChanges,
): T[] {
  const before = new Map(base.map((item) => [item.id, item]));
  const after = new Map(next.map((item) => [item.id, item]));
  const result = latest.flatMap((item) => {
    const previous = before.get(item.id);
    const edited = after.get(item.id);
    if (previous === undefined) return [item];
    if (edited === undefined) return [];
    return [merge(previous, edited, item)];
  });
  const ids = new Set(latest.map((item) => item.id));
  return [...result, ...next.filter((item) => !before.has(item.id) && !ids.has(item.id))];
}

/** Web Locks serialize writes from tabs and the installed app without network persistence. */
export function withStorageLock(write: () => void): void | Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.locks !== undefined) {
    return navigator.locks.request('affordi.storage', write).catch(write);
  } else write();
}

/** Completes a save after queued writes, or immediately for a synchronous state owner. */
export function afterStorageSave(result: void | Promise<void>, complete: () => void) {
  if (result === undefined) complete();
  else void result.then(complete);
}
