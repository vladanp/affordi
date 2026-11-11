import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBackup, parseBackup, restoreBackup } from './backup';
import { defaultSettings, saveSettings } from './storage';

beforeEach(() => localStorage.clear());
describe('on-device backups', () => {
  it('exports validated data and round trips zero bills and custom schedules', () => {
    expect(createBackup()).toBeNull();
    const settings = { ...defaultSettings(), workBreak: 30, weeklyHours: 37.5 };
    saveSettings(settings);
    localStorage.setItem(
      'affordi.bills.v1',
      JSON.stringify({
        version: 1,
        bills: [{ id: 'b', name: 'Power', entries: [{ month: '2026-11', amount: 0 }] }],
      }),
    );
    const backup = createBackup()!;
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
    localStorage.clear();
    expect(restoreBackup(backup)).toBe(true);
    expect(createBackup()).toEqual(backup);
  });
  it.each(['bad', 'null', '{}', '{"version":2}', '{"version":1,"settings":{}}'])(
    'rejects malformed or unsupported backups: %s',
    (text) => {
      expect(parseBackup(text)).toBeNull();
    },
  );
  it('rejects invalid and duplicate financial records instead of dropping them silently', () => {
    saveSettings(defaultSettings());
    const base = createBackup()!;
    const cost = { id: 'a', name: 'Rent', amount: 10, firstPayment: null, lastPayment: null };
    expect(parseBackup(JSON.stringify({ ...base, fixedCosts: [cost, cost] }))).toBeNull();
    expect(
      parseBackup(
        JSON.stringify({
          ...base,
          bills: [{ id: 'a', name: 'Power', entries: [{ month: '2026-11', amount: -1 }] }],
        }),
      ),
    ).toBeNull();
    expect(
      parseBackup(JSON.stringify({ ...base, fixedCosts: [{ ...cost, amount: 0 }] })),
    ).toBeNull();
    const bill = { id: 'a', name: 'Power', entries: [] };
    expect(parseBackup(JSON.stringify({ ...base, bills: [bill, bill] }))).toBeNull();
  });
  it('restores the old records if a storage write fails', () => {
    saveSettings(defaultSettings());
    const original = createBackup()!;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('full');
    });
    expect(
      restoreBackup({ ...original, settings: { ...original.settings, netIncome: 9000 } }),
    ).toBe(false);
    spy.mockRestore();
    expect(createBackup()).toEqual(original);
  });
  it('reports a blocked storage boundary without throwing', () => {
    saveSettings(defaultSettings());
    const backup = createBackup()!;
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(restoreBackup(backup)).toBe(false);
    spy.mockRestore();
  });
});
