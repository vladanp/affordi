import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FixedCost } from '../domain/fixedCosts';
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
  hideAmounts: false,
};

/** Holds settings the way the app does, so hiding amounts updates the page. */
interface EarningsPageProps {
  fixedCosts?: readonly FixedCost[];
  initial?: AffordiSettings;
}

function EarningsPage({ fixedCosts = noFixedCosts, initial = settings }: EarningsPageProps) {
  const [current, setCurrent] = useState(initial);
  return (
    <Earnings
      fixedCosts={fixedCosts}
      onHideAmountsChange={(hideAmounts) => setCurrent({ ...current, hideAmounts })}
      settings={current}
    />
  );
}

const noFixedCosts: readonly FixedCost[] = [];

function rent(amount: number): FixedCost {
  return { id: 'rent', name: 'Rent', amount, lastPayment: null };
}

function fixedCostsCard() {
  return document.querySelector('.earnings-fixed-costs');
}

function liveAmounts() {
  return [...document.querySelectorAll('.live-amount')].map((amount) => amount.textContent);
}

function workStatus() {
  return document.querySelector('.earnings-status');
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
    render(<EarningsPage />);

    expect(screen.getByRole('heading', { name: 'How much do you earn?' })).toBeInTheDocument();
    expect(liveAmounts()).toEqual(['€49.4505', '€51.9231', '€1,960.22 of €3,000.00']);
    expect(screen.getByText('Around the clock since midnight')).toBeInTheDocument();
    expect(workStatus()).toHaveTextContent('Working until 5:00 PM · 5 hours left');
    expect(screen.getByText('Workdays: 14 of 22')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('65% of this month’s take home pay')).toHaveClass('visually-hidden');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(liveAmounts()).toEqual(['€49.5192', '€52.2115', '€1,960.51 of €3,000.00']);
    expect(workStatus()).toHaveTextContent('Working until 5:00 PM · 4 hours and 59 minutes left');
  });

  it('updates ten times a second, or once a second with reduced motion', () => {
    const first = render(<EarningsPage />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(liveAmounts()[0]).toBe('€49.4507');
    first.unmount();

    stubReducedMotion(true);
    vi.setSystemTime(new Date(2026, 9, 21, 12));
    render(<EarningsPage />);
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
    render(<EarningsPage />);
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
    render(<EarningsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(liveAmounts()).toEqual(['••••Hidden', '••••Hidden', '••••Hidden']);
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Hidden')).toHaveLength(3 + 4 * 2 + 3);
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(workStatus()).toHaveTextContent('Working until 5:00 PM · 5 hours left');

    fireEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
    expect(liveAmounts()).toEqual(['€49.4505', '€51.9231', '€1,960.22 of €3,000.00']);
  });

  it('shows how much of this month’s fixed costs the pay covers so far', () => {
    const first = render(<EarningsPage fixedCosts={[rent(2_500)]} />);
    expect(screen.getByText('Fixed costs this month')).toBeInTheDocument();
    expect(fixedCostsCard()?.querySelector('.live-amount')).toHaveTextContent(
      '€1,960.22 of €2,500.00',
    );
    expect(fixedCostsCard()).toHaveTextContent('Covered so far');
    expect(screen.getByText('78% of this month’s fixed costs covered')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(fixedCostsCard()?.querySelector('.live-amount')).toHaveTextContent('••••Hidden');
    expect(fixedCostsCard()).toHaveTextContent('78%');
    first.unmount();

    const second = render(<EarningsPage fixedCosts={[rent(1_000)]} />);
    expect(fixedCostsCard()?.querySelector('.live-amount')).toHaveTextContent(/^€1,000\.00$/);
    expect(fixedCostsCard()).toHaveTextContent('All covered');
    expect(screen.getByText('100% of this month’s fixed costs covered')).toBeInTheDocument();
    second.unmount();

    render(<EarningsPage fixedCosts={[{ ...rent(500), lastPayment: '2026-09' }]} />);
    expect(fixedCostsCard()).toBeNull();
  });

  it('says when work starts, when it ended, and when there is none', () => {
    vi.setSystemTime(new Date(2026, 9, 21, 7, 30));
    const morning = render(<EarningsPage />);
    expect(screen.getByText('Starts at 9:00 AM')).toBeInTheDocument();
    expect(liveAmounts()[1]).toBe('€0.0000');
    morning.unmount();

    vi.setSystemTime(new Date(2026, 9, 21, 18));
    const evening = render(<EarningsPage />);
    expect(screen.getByText('Finished at 5:00 PM')).toBeInTheDocument();
    expect(liveAmounts()[1]).toBe('€138.4615');
    expect(liveAmounts()[2]).toBe('€2,045.45 of €3,000.00');
    expect(
      document.querySelector<HTMLElement>('.earnings-month .meter > span')?.style.inlineSize,
    ).toMatch(/^68\.18/);
    evening.unmount();

    vi.setSystemTime(new Date(2026, 9, 24, 18));
    render(<EarningsPage initial={{ ...settings, language: 'sr', currency: 'RSD' }} />);
    expect(screen.getByText('Danas je slobodan dan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Koliko zarađujete?' })).toBeInTheDocument();
  });
});
