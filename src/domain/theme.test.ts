import { describe, expect, it } from 'vitest';

import { applyTheme, isThemePreference, themePreferences } from './theme';

function rootWithThemeColors() {
  const testDocument = document.implementation.createHTMLDocument();
  for (const theme of ['light', 'dark']) {
    const meta = testDocument.createElement('meta');
    meta.id = `theme-color-${theme}`;
    testDocument.head.append(meta);
  }
  return testDocument.documentElement;
}

describe('theme preferences', () => {
  it('exposes the supported system, light, and dark choices', () => {
    expect(themePreferences).toEqual(['system', 'light', 'dark']);
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it('uses the operating-system theme for system and removes explicit overrides', () => {
    const root = rootWithThemeColors();
    root.dataset.theme = 'dark';

    applyTheme('system', root);

    expect(root.getAttribute('data-theme')).toBeNull();
    expect(root.ownerDocument.querySelector('#theme-color-light')?.getAttribute('media')).toBe(
      '(prefers-color-scheme: light)',
    );
    expect(root.ownerDocument.querySelector('#theme-color-dark')?.getAttribute('media')).toBe(
      '(prefers-color-scheme: dark)',
    );
  });

  it.each(['light', 'dark'] as const)('sets the explicit %s theme', (theme) => {
    const root = rootWithThemeColors();

    applyTheme(theme, root);

    expect(root.dataset.theme).toBe(theme);
    expect(root.ownerDocument.querySelector(`#theme-color-${theme}`)?.getAttribute('media')).toBe(
      'all',
    );
    expect(
      root.ownerDocument
        .querySelector(`#theme-color-${theme === 'light' ? 'dark' : 'light'}`)
        ?.getAttribute('media'),
    ).toBe('not all');
  });
});
