import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSettings,
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
  currency: 'USD',
  language: 'en',
  theme: 'system',
};

describe('settings persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round trips versioned settings', () => {
    expect(saveSettings(settings)).toBe(true);
    expect(loadSettings()).toEqual(settings);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '').version).toBe(1);
  });

  it.each(['not json', '{}', '{"version":2}', '{"version":1,"settings":{"netIncome":0}}'])(
    'recovers from malformed data: %s',
    (raw) => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
      expect(loadSettings()).toBeNull();
    },
  );

  it('never throws when storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadSettings()).toBeNull();
    expect(saveSettings(settings)).toBe(false);
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('clears saved settings', () => {
    saveSettings(settings);
    expect(clearSettings()).toBe(true);
    expect(loadSettings()).toBeNull();
  });
});
