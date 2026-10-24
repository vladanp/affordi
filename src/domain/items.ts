/** Names and ids shared by the lists Affordi saves, such as fixed costs and bills. */

export const MAX_ITEM_NAME_LENGTH = 60;
const MAX_ID_LENGTH = 64;

/** A trimmed name of one to sixty characters. */
export function isItemName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= MAX_ITEM_NAME_LENGTH
  );
}

export function isItemId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

export function createItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
