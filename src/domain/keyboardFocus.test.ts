import { afterEach, describe, expect, it } from 'vitest';

import { trackKeyboardFocus } from './keyboardFocus';

describe('keyboard focus', () => {
  let stopTracking: (() => void) | undefined;

  afterEach(() => {
    stopTracking?.();
    document.documentElement.removeAttribute('data-keyboard');
  });

  it('shows focus rings once Tab is pressed and hides them on a tap or click', () => {
    const root = document.documentElement;
    stopTracking = trackKeyboardFocus(root);
    expect(root.hasAttribute('data-keyboard')).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(root.hasAttribute('data-keyboard')).toBe(false);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    expect(root.hasAttribute('data-keyboard')).toBe(true);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(root.hasAttribute('data-keyboard')).toBe(false);
  });

  it('stops following the keyboard once tracking stops', () => {
    const root = document.documentElement;
    trackKeyboardFocus(root)();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(root.hasAttribute('data-keyboard')).toBe(false);
  });
});
