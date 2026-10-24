import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Bill } from '../domain/bills';
import type { FixedCost } from '../domain/fixedCosts';
import type { AffordiSettings } from '../domain/storage';
import { Bills } from './Bills';

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
const electricity: Bill = {
  id: 'e',
  name: 'Electricity',
  entries: [
    { month: '2025-10', amount: 200 },
    { month: '2025-11', amount: 90 },
    { month: '2026-01', amount: 120 },
    { month: '2026-09', amount: 80 },
    { month: '2026-10', amount: 91 },
  ],
};
const water: Bill = {
  id: 'w',
  name: 'Water',
  entries: [
    { month: '2026-09', amount: 30 },
    { month: '2026-10', amount: 34 },
  ],
};
const noBills: Bill[] = [];
const noFixedCosts: FixedCost[] = [];

interface PageProps {
  fixedCosts?: FixedCost[];
  initialBills?: Bill[];
}

/** Holds bills and settings the way the app does, so changes show on the page. */
function BillsPage({ fixedCosts = noFixedCosts, initialBills = noBills }: PageProps) {
  const [bills, setBills] = useState(initialBills);
  const [current, setCurrent] = useState(settings);
  return (
    <Bills
      bills={bills}
      fixedCosts={fixedCosts}
      onBillsChange={setBills}
      onHideAmountsChange={(hideAmounts) => setCurrent({ ...current, hideAmounts })}
      settings={current}
    />
  );
}

function dialog() {
  return within(screen.getByRole('dialog'));
}

function rows() {
  return within(screen.getByRole('list', { name: 'Your bills' }))
    .getAllByRole('listitem')
    .map((row) => row.textContent);
}

describe('Bills', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 21, 12) }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('starts empty and adds a bill with this month’s amount', () => {
    render(<BillsPage />);
    expect(screen.getByRole('heading', { name: 'What do your bills cost?' })).toBeInTheDocument();
    expect(screen.getByText(/like electricity, water, or heating/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add bill' }));
    expect(dialog().getByRole('heading', { name: 'Add a bill' })).toBeInTheDocument();
    expect(dialog().getByRole('combobox', { name: 'Month' })).toHaveValue('2026-10');
    fireEvent.click(dialog().getByRole('button', { name: 'Add bill' }));
    expect(dialog().getByText('Enter a name.')).toBeInTheDocument();
    expect(dialog().getByText('Enter an amount greater than 0.')).toBeInTheDocument();

    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Electricity' },
    });
    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount' }), {
      target: { value: '91' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add bill' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()).toEqual([
      'Electricity€91.005 hours and 15 minutes of work3%3% of your payOctober: €91.00',
    ]);
    expect(screen.getByRole('button', { name: 'Add bill' })).toHaveFocus();
  });

  it('shows an average month in money, work time, share of pay, and what is left', () => {
    render(
      <BillsPage
        fixedCosts={[{ id: 'r', name: 'Rent', amount: 1_000, lastPayment: null }]}
        initialBills={[water, electricity]}
      />,
    );
    const average = screen.getByText('Bills in an average month').closest('div')!;
    expect(within(average).getByText('€127.25')).toBeInTheDocument();
    expect(within(average).getByText('7 hours and 21 minutes of work')).toBeInTheDocument();
    expect(within(average).getByText('4% of your monthly take home pay')).toBeInTheDocument();
    expect(within(average).getByText('About €1,527.00 a year')).toBeInTheDocument();
    const left = screen.getByText('Left after fixed costs and bills').closest('div')!;
    expect(within(left).getByText('€1,872.75')).toBeInTheDocument();
    expect(within(left).getByText('€86.43 per workday')).toBeInTheDocument();
    expect(rows()).toEqual([
      'Electricity€95.255 hours and 30 minutes of work3%3% of your payOctober: €91.00 · 4% below average',
      'Water€32.001 hour and 51 minutes of work1%1% of your payOctober: €34.00 · 6% above average',
    ]);
  });

  it('reads out a month of the chart and moves with the arrow keys', () => {
    render(<BillsPage initialBills={[electricity, water]} />);
    const chart = screen.getByRole('group', { name: 'Bills per month' });
    expect(screen.getByText('October 2026: €125.00')).toBeInTheDocument();
    expect(screen.getByText('Average €127.25')).toBeInTheDocument();
    expect(
      screen.getByText('Highest: October, €125.00 · Lowest: November, €90.00'),
    ).toBeInTheDocument();

    fireEvent.keyDown(chart, { key: 'ArrowLeft' });
    expect(screen.getByText('September 2026: €110.00')).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: 'Home' });
    expect(screen.getByText('November 2025: €90.00')).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(screen.getByText('December 2025: no amounts')).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: 'End' });
    expect(screen.getByText('October 2026: €125.00')).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Bills per month' });
    expect(within(table).getAllByRole('row')).toHaveLength(12);
    expect(within(table).getByRole('row', { name: 'January 2026 €120.00' })).toBeInTheDocument();
  });

  it('replaces this month’s amount and removes an old one', () => {
    render(<BillsPage initialBills={[electricity]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Electricity' }));
    expect(dialog().getByRole('heading', { name: 'Electricity' })).toBeInTheDocument();
    expect(
      dialog().getByText('Saved for this month: €91.00. A new amount replaces it.'),
    ).toBeInTheDocument();
    expect(dialog().getAllByRole('listitem')).toHaveLength(5);

    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount' }), {
      target: { value: '95' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Remove January 2026' }));
    expect(dialog().getAllByRole('listitem')).toHaveLength(4);
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    // November 90, September 80, and October 95 remain in the last twelve months.
    expect(rows()).toEqual([
      'Electricity€88.335 hours and 6 minutes of work3%3% of your payOctober: €95.00 · 8% above average',
    ]);
    expect(screen.getByRole('button', { name: 'Edit Electricity' })).toHaveFocus();
  });

  it('saves a name change without a new amount, and asks before deleting', () => {
    render(<BillsPage initialBills={[electricity, water]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Water' }));
    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Water and sewage' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Edit Water and sewage' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Electricity' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(dialog().getByRole('heading', { name: 'Delete Electricity?' })).toBeInTheDocument();
    expect(dialog().getByRole('button', { name: 'Keep' })).toHaveFocus();
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Electricity')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add bill' })).toHaveFocus();
  });

  it('hides amounts but keeps work time, shares, and the chart', () => {
    render(<BillsPage initialBills={[electricity, water]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.getByText('7 hours and 21 minutes of work')).toBeInTheDocument();
    expect(screen.getByText('October 2026: ••••')).toBeInTheDocument();
    expect(rows()[0]).toContain('October · 4% below average');
  });

  it('marks a bill without recent amounts and keeps it out of the average', () => {
    const old: Bill = { id: 'o', name: 'Old phone', entries: [{ month: '2024-05', amount: 50 }] };
    render(<BillsPage initialBills={[old, water]} />);
    expect(rows()).toEqual([
      'Water€32.001 hour and 51 minutes of work1%1% of your payOctober: €34.00 · 6% above average',
      'Old phone–No amounts in the last 12 monthsMay 2024: €50.00',
    ]);
    expect(screen.getAllByText('€32.00')).toHaveLength(2);
  });
});
