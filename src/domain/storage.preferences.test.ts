import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSettings,
  isValidAffordiSettings,
  loadSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  type AffordiSettings,
} from './storage';

const settings: AffordiSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  workStart: 540,
  workEnd: 1020,
  workDays: [1, 2, 3, 4, 5],
  currency: 'EUR',
  language: 'fr',
  theme: 'dark',
  hideAmounts: false,
};

describe('language and theme persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('round trips the selected language and theme through local storage', () => {
    expect(saveSettings(settings)).toBe(true);
    expect(loadSettings()).toEqual(settings);

    const persisted = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
    expect(persisted.settings).toMatchObject({ language: 'fr', theme: 'dark' });
  });

  it('falls back safely when persisted preferences are invalid', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { ...settings, language: 'xx', theme: 'sepia', hideAmounts: 'yes' },
      }),
    );

    expect(loadSettings()).toMatchObject({ language: 'en', theme: 'system', hideAmounts: false });
  });

  it('round trips hidden amounts and refuses a value that is not a boolean', () => {
    expect(saveSettings({ ...settings, hideAmounts: true })).toBe(true);
    expect(loadSettings()).toMatchObject({ hideAmounts: true });
    expect(isValidAffordiSettings({ ...settings, hideAmounts: 1 })).toBe(false);
  });

  it('keeps legacy income settings usable with detected language and system theme', () => {
    vi.stubGlobal('navigator', { language: 'it-IT', languages: ['it-IT'] });
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3_000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'EUR',
        },
      }),
    );

    expect(loadSettings()).toMatchObject({ language: 'it', theme: 'system' });
  });

  it('clears language and theme together with saved income settings', () => {
    saveSettings(settings);
    expect(clearSettings()).toBe(true);
    expect(loadSettings()).toBeNull();
  });
});
