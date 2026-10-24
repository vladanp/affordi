import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AffordiSettings } from '../domain/storage';
import { Earnings } from './Earnings';

const settings: AffordiSettings = {
  netIncome: 3_000,
  payFrequency: 'monthly',
  weeklyHours: 40,
  workingDaysPerWeek: 5,
  workStart: 540,
  workEnd: 1020,
  workDays: [1, 2, 3, 4, 5],
  currency: 'EUR',
  language: 'en',
  theme: 'system',
};

function liveAmounts() {
  return [...document.querySelectorAll('.live-amount')].map((amount) => amount.textContent);
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe('Earnings', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 21, 12) }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('counts today around the clock and at work while time passes', () => {
    render(<Earnings settings={settings} />);

    expect(screen.getByRole('heading', { name: 'How much do you earn?' })).toBeInTheDocument();
    expect(liveAmounts()).toEqual(['€49.4505', '€51.9231']);
    expect(screen.getByText('Around the clock since midnight')).toBeInTheDocument();
    expect(screen.getByText('Working until 5:00 PM · 5 hours left')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(liveAmounts()).toEqual(['€49.5192', '€52.2115']);
    expect(screen.getByText('Working until 5:00 PM · 4 hours and 59 minutes left')).toBeVisible();
  });

  it('updates ten times a second, or once a second with reduced motion', () => {
    const first = render(<Earnings settings={settings} />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(liveAmounts()[0]).toBe('€49.4507');
    first.unmount();

    stubReducedMotion(true);
    vi.setSystemTime(new Date(2026, 9, 21, 12));
    render(<Earnings settings={settings} />);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(liveAmounts()[0]).toBe('€49.4505');
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(liveAmounts()[0]).toBe('€49.4517');
  });

  it('breaks pay down around the clock and at work with shared totals', () => {
    render(<Earnings settings={settings} />);
    const table = screen.getByRole('table', { name: 'Your take home pay, broken down' });
    const cells = (name: string) =>
      within(within(table).getByRole('row', { name: new RegExp(`^${name}`) }))
        .getAllByRole('cell')
        .map((cell) => cell.textContent);

    expect(within(table).getByRole('columnheader', { name: 'Around the clock' })).toBeVisible();
    expect(cells('Per second')).toEqual(['€0.0011', '€0.0048']);
    expect(cells('Per minute')).toEqual(['€0.069', '€0.29']);
    expect(cells('Per hour')).toEqual(['€4.12', '€17.31']);
    expect(cells('Per day')).toEqual(['€98.90', '€138.46']);
    expect(cells('Per week')).toEqual(['€692.31']);
    expect(cells('Per month')).toEqual(['€3,000.00']);
    expect(cells('Per year')).toEqual(['€36,000.00']);
  });

  it('hides every amount on request and shows them again', () => {
    render(<Earnings settings={settings} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(liveAmounts()).toEqual(['••••Hidden', '••••Hidden']);
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Hidden')).toHaveLength(2 + 4 * 2 + 3);
    expect(screen.getByText('Working until 5:00 PM · 5 hours left')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
    expect(liveAmounts()).toEqual(['€49.4505', '€51.9231']);
  });

  it('says when work starts, when it ended, and when there is none', () => {
    vi.setSystemTime(new Date(2026, 9, 21, 7, 30));
    const morning = render(<Earnings settings={settings} />);
    expect(screen.getByText('Starts at 9:00 AM')).toBeInTheDocument();
    expect(liveAmounts()[1]).toBe('€0.0000');
    morning.unmount();

    vi.setSystemTime(new Date(2026, 9, 21, 18));
    const evening = render(<Earnings settings={settings} />);
    expect(screen.getByText('Finished at 5:00 PM')).toBeInTheDocument();
    expect(liveAmounts()[1]).toBe('€138.4615');
    evening.unmount();

    vi.setSystemTime(new Date(2026, 9, 24, 18));
    render(<Earnings settings={{ ...settings, language: 'sr', currency: 'RSD' }} />);
    expect(screen.getByText('Danas je slobodan dan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Koliko zarađujete?' })).toBeInTheDocument();
  });
});
