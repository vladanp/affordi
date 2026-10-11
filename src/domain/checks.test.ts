import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addCheck,
  CHECKS_STORAGE_KEY,
  clearChecks,
  createCheck,
  loadChecks,
  MAX_NAME_LENGTH,
  recurringYearlyTotal,
  saveChecks,
  type SavedCheck,
} from './checks';

const settings = {
  netIncome: 3_000,
  payFrequency: 'monthly' as const,
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  currency: 'EUR' as const,
};

function check(overrides: Partial<SavedCheck> = {}): SavedCheck {
  return {
    id: 'id',
    name: '',
    price: 10,
    repeat: 'once',
    currency: 'EUR',
    savedAt: 1,
    ...overrides,
  };
}

describe('saved items storage', () => {
  beforeEach(() => localStorage.clear());

  it('round trips a versioned list and clears it', () => {
    const checks = [check({ id: 'b' }), check({ id: 'a', repeat: 'monthly' })];
    expect(saveChecks(checks)).toBe(true);
    expect(JSON.parse(localStorage.getItem(CHECKS_STORAGE_KEY) ?? '').version).toBe(1);
    expect(loadChecks()).toEqual(checks);
    expect(clearChecks()).toBe(true);
    expect(loadChecks()).toEqual([]);
  });

  it.each(['not json', '{"version":2,"checks":[]}', '{"version":1}', '{"version":1,"checks":{}}'])(
    'treats malformed data as an empty list: %s',
    (raw) => {
      localStorage.setItem(CHECKS_STORAGE_KEY, raw);
      expect(loadChecks()).toEqual([]);
    },
  );

  it('skips malformed entries and keeps valid ones', () => {
    const valid = check({ id: 'ok' });
    localStorage.setItem(
      CHECKS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        checks: [
          valid,
          null,
          { ...valid, id: '' },
          { ...valid, price: -1 },
          { ...valid, repeat: 'daily' },
          { ...valid, currency: 'GBP' },
          { ...valid, name: 'x'.repeat(MAX_NAME_LENGTH + 1) },
          { ...valid, savedAt: 'yesterday' },
        ],
      }),
    );
    expect(loadChecks()).toEqual([valid]);
  });

  it('never throws when storage is unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(saveChecks([check()])).toBe(false);
    expect(clearChecks()).toBe(false);
    setItem.mockRestore();
    removeItem.mockRestore();
  });
});

describe('creating and adding items', () => {
  it('trims and limits names and gives every item its own identifier', () => {
    const first = createCheck(`  ${'n'.repeat(80)}  `, 12.99, 'monthly', 'USD', 1_000);
    const second = createCheck('Gym', 40, 'monthly', 'USD', 1_000);
    expect(first.name).toHaveLength(MAX_NAME_LENGTH);
    expect(first).toMatchObject({
      price: 12.99,
      repeat: 'monthly',
      currency: 'USD',
      savedAt: 1_000,
    });
    expect(first.id).not.toBe(second.id);
  });

  it('adds new items first and keeps at most one hundred', () => {
    const many = Array.from({ length: 100 }, (_, index) => check({ id: String(index) }));
    const next = addCheck(many, check({ id: 'new' }));
    expect(next).toHaveLength(100);
    expect(next[0]?.id).toBe('new');
    expect(next.at(-1)?.id).toBe('98');
  });
});

describe('recurringYearlyTotal', () => {
  it('adds every recurring item in the current currency over one year', () => {
    const total = recurringYearlyTotal(
      [
        check({ price: 4.5, repeat: 'workday' }),
        check({ price: 20, repeat: 'weekly' }),
        check({ price: 12.99, repeat: 'monthly' }),
        check({ price: 120, repeat: 'yearly' }),
        check({ price: 900, repeat: 'once' }),
        check({ price: 50, repeat: 'monthly', currency: 'USD' }),
      ],
      settings,
    );
    const yearlyCost = 4.5 * 260 + 20 * 52 + 12.99 * 12 + 120;
    expect(total?.percentage).toBeCloseTo((yearlyCost / 36_000) * 100, 10);
    expect(total?.workHours).toBeCloseTo(yearlyCost / (36_000 / 2_080), 10);
  });

  it('returns null without recurring items', () => {
    expect(
      recurringYearlyTotal([check(), check({ currency: 'USD', repeat: 'yearly' })], settings),
    ).toBeNull();
    expect(
      recurringYearlyTotal([check({ repeat: 'monthly' })], { ...settings, netIncome: 0 }),
    ).toBeNull();
  });
});
