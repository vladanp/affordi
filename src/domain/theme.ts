export const themePreferences = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof themePreferences)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && themePreferences.some((theme) => theme === value);
}

export function applyTheme(theme: ThemePreference, root = document.documentElement): void {
  const lightThemeColor = root.ownerDocument.querySelector<HTMLMetaElement>('#theme-color-light');
  const darkThemeColor = root.ownerDocument.querySelector<HTMLMetaElement>('#theme-color-dark');
  lightThemeColor?.setAttribute(
    'media',
    theme === 'system' ? '(prefers-color-scheme: light)' : theme === 'light' ? 'all' : 'not all',
  );
  darkThemeColor?.setAttribute(
    'media',
    theme === 'system' ? '(prefers-color-scheme: dark)' : theme === 'dark' ? 'all' : 'not all',
  );

  if (theme === 'system') {
    delete root.dataset.theme;
    return;
  }

  root.dataset.theme = theme;
}
