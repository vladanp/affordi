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
  workStart: 540,
  workEnd: 1020,
  workDays: [1, 2, 3, 4, 5],
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

  it.each([
    'not json',
    '{}',
    '{"version":2}',
    '{"version":1,"settings":{"netIncome":0}}',
    JSON.stringify({ version: 1, settings: { ...settings, currency: 'GBP' } }),
  ])('recovers from malformed data: %s', (raw) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
    expect(loadSettings()).toBeNull();
  });

  it('drops settings from removed features so older saves stay usable', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { ...settings, monthlySavings: 250, commuteMinutes: 30, monthlyWorkCosts: 90 },
      }),
    );
    expect(loadSettings()).toEqual(settings);
  });

  it('gives saves from before work times a schedule from their weekly hours', () => {
    const { workStart: _start, workEnd: _end, workDays: _days, ...legacy } = settings;
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { ...legacy, weeklyHours: 30, workingDaysPerWeek: 4 },
      }),
    );
    expect(loadSettings()).toEqual({
      ...settings,
      weeklyHours: 30,
      workingDaysPerWeek: 4,
      workStart: 540,
      workEnd: 990,
      workDays: [1, 2, 3, 4],
    });
  });

  it('derives weekly hours from the saved schedule', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        settings: { ...settings, workEnd: 780, weeklyHours: 99, workingDaysPerWeek: 2 },
      }),
    );
    expect(loadSettings()).toMatchObject({ workEnd: 780, weeklyHours: 20, workingDaysPerWeek: 5 });
  });

  it('falls back to weekly hours when the saved schedule is malformed', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, settings: { ...settings, workDays: [5, 1], weeklyHours: 24 } }),
    );
    expect(loadSettings()).toMatchObject({ workEnd: 828, workDays: [1, 2, 3, 4, 5] });
  });

  it('treats a save without any usable schedule as a first visit', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, settings: { ...settings, workEnd: 0, weeklyHours: 200 } }),
    );
    expect(loadSettings()).toBeNull();
  });

  it('refuses to save weekly hours that disagree with the schedule', () => {
    expect(saveSettings({ ...settings, weeklyHours: 38 })).toBe(false);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

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

  it('clears saved settings and saved items from earlier releases', () => {
    saveSettings(settings);
    localStorage.setItem('affordi.checks.v1', JSON.stringify({ version: 1, checks: [] }));
    expect(clearSettings()).toBe(true);
    expect(loadSettings()).toBeNull();
    expect(localStorage.getItem('affordi.checks.v1')).toBeNull();
  });
});
