import type { CSSProperties } from 'react';

/** Bills are told apart by eight colors, in the order they were added; any more share a gray. */
export const BILL_COLORS = 8;

type BillColorStyle = CSSProperties & { '--bill-color'?: string };

/**
 * The color of the bill at an index of the list, for its part of the chart and its swatch. It
 * is a custom property, so a forced colors theme still replaces the fill that uses it.
 */
export function billColor(index: number): BillColorStyle {
  return index < BILL_COLORS ? { '--bill-color': `var(--color-series-${index + 1})` } : {};
}
