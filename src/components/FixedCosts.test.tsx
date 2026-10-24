import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FixedCost } from '../domain/fixedCosts';
import type { AffordiSettings } from '../domain/storage';
import { FixedCosts } from './FixedCosts';

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
const mortgage: FixedCost = { id: 'a', name: 'Mortgage', amount: 950, lastPayment: '2049-03' };
const insurance: FixedCost = { id: 'b', name: 'Insurance', amount: 120, lastPayment: null };
const carLoan: FixedCost = { id: 'c', name: 'Car loan', amount: 380, lastPayment: '2026-09' };

const noFixedCosts: FixedCost[] = [];

interface PageProps {
  initialCosts?: FixedCost[];
  initialSettings?: AffordiSettings;
}

/** Holds costs and settings the way the app does, so changes show on the page. */
function FixedCostsPage({ initialCosts = noFixedCosts, initialSettings = settings }: PageProps) {
  const [costs, setCosts] = useState(initialCosts);
  const [current, setCurrent] = useState(initialSettings);
  return (
    <FixedCosts
      fixedCosts={costs}
      onFixedCostsChange={setCosts}
      onHideAmountsChange={(hideAmounts) => setCurrent({ ...current, hideAmounts })}
      settings={current}
    />
  );
}

function dialog() {
  return within(screen.getByRole('dialog'));
}

function rows() {
  return screen.getAllByRole('listitem').map((row) => row.textContent);
}

describe('FixedCosts', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 21, 12) }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('starts empty and adds a cost once the form is complete', () => {
    render(<FixedCostsPage />);
    expect(
      screen.getByRole('heading', { name: 'What do you pay each month?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/like rent, a mortgage, loans, or insurance/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add fixed cost' }));
    expect(dialog().getByRole('heading', { name: 'Add a fixed cost' })).toBeInTheDocument();
    fireEvent.click(dialog().getByRole('button', { name: 'Add fixed cost' }));
    expect(dialog().getByText('Enter a name.')).toBeInTheDocument();
    expect(dialog().getByText('Enter an amount greater than 0.')).toBeInTheDocument();
    expect(dialog().getByRole('textbox', { name: 'Name' })).toHaveFocus();

    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: ' Mortgage ' },
    });
    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount each month' }), {
      target: { value: '950' },
    });
    fireEvent.change(dialog().getByRole('combobox', { name: 'Month' }), { target: { value: '3' } });
    fireEvent.click(dialog().getByRole('button', { name: 'Add fixed cost' }));
    expect(
      dialog().getByText('Choose a month and a year, or leave both empty.'),
    ).toBeInTheDocument();
    expect(dialog().getByRole('combobox', { name: 'Month' })).toHaveFocus();

    fireEvent.change(dialog().getByRole('combobox', { name: 'Year' }), {
      target: { value: '2049' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add fixed cost' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()).toEqual([
      'Mortgage€950.006 days and 7 hours of work32%32% of your payLast payment: March 2049',
    ]);
    expect(screen.getByText('€2,050.00')).toBeInTheDocument();
    expect(screen.getByText('€94.62 per workday')).toBeInTheDocument();
    expect(screen.getByText('32% of your monthly take home pay')).toBeInTheDocument();
    // The empty state's button is gone, so focus moves to the add button above the list.
    expect(screen.getByRole('button', { name: 'Add fixed cost' })).toHaveFocus();
  });

  it('sums costs still paid, in work time and as a share of pay', () => {
    render(<FixedCostsPage initialCosts={[insurance, carLoan, mortgage]} />);
    const total = screen.getByText('Fixed costs each month').closest('div')!;
    expect(within(total).getByText('€1,070.00')).toBeInTheDocument();
    expect(within(total).getByText('7 days and 6 hours of work')).toBeInTheDocument();
    expect(within(total).getByText('36% of your monthly take home pay')).toBeInTheDocument();
    expect(screen.getByText('Left each month')).toBeInTheDocument();
    expect(screen.getByText('€1,930.00')).toBeInTheDocument();
    expect(rows()).toEqual([
      'Mortgage€950.006 days and 7 hours of work32%32% of your payLast payment: March 2049',
      'Insurance€120.006 hours and 56 minutes of work4%4% of your pay',
      'Car loan€380.00EndedLast payment: September 2026',
    ]);
  });

  it('edits a cost and returns focus to it', () => {
    render(<FixedCostsPage initialCosts={[mortgage, insurance]} />);
    const edit = screen.getByRole('button', { name: 'Edit Mortgage' });
    fireEvent.click(edit);
    expect(dialog().getByRole('heading', { name: 'Edit fixed cost' })).toBeInTheDocument();
    expect(dialog().getByRole('textbox', { name: 'Name' })).toHaveValue('Mortgage');
    expect(dialog().getByRole('textbox', { name: 'Amount each month' })).toHaveValue('950');
    expect(dialog().getByRole('combobox', { name: 'Month' })).toHaveValue('3');
    expect(dialog().getByRole('combobox', { name: 'Year' })).toHaveValue('2049');

    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount each month' }), {
      target: { value: '900.5' },
    });
    fireEvent.change(dialog().getByRole('combobox', { name: 'Month' }), { target: { value: '' } });
    fireEvent.change(dialog().getByRole('combobox', { name: 'Year' }), { target: { value: '' } });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()[0]).toBe('Mortgage€900.506 days and 4 hours of work30%30% of your pay');
    expect(edit).toHaveFocus();
  });

  it('asks before deleting a cost', () => {
    render(<FixedCostsPage initialCosts={[mortgage, insurance]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Mortgage' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(dialog().getByRole('heading', { name: 'Delete Mortgage?' })).toBeInTheDocument();
    expect(dialog().getByRole('button', { name: 'Keep' })).toHaveFocus();
    fireEvent.click(dialog().getByRole('button', { name: 'Keep' }));
    expect(dialog().getByRole('heading', { name: 'Edit fixed cost' })).toBeInTheDocument();

    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    fireEvent.click(dialog().getAllByRole('button', { name: 'Delete' }).at(-1)!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Mortgage')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add fixed cost' })).toHaveFocus();
  });

  it('keeps an ended cost unless its last payment moves to another past month', () => {
    render(<FixedCostsPage initialCosts={[carLoan]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Car loan' }));
    fireEvent.change(dialog().getByRole('combobox', { name: 'Month' }), { target: { value: '8' } });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(dialog().getByText('Choose this month or later.')).toBeInTheDocument();

    fireEvent.change(dialog().getByRole('combobox', { name: 'Month' }), { target: { value: '9' } });
    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'First car' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(rows()).toEqual(['First car€380.00EndedLast payment: September 2026']);
  });

  it('closes on Escape and steps back from the delete question first', () => {
    render(<FixedCostsPage initialCosts={[mortgage]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Mortgage' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(dialog().getByRole('heading', { name: 'Edit fixed cost' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides amounts but keeps work time and shares', () => {
    render(<FixedCostsPage initialCosts={[mortgage, insurance]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Hidden')).toHaveLength(2 + 2);
    expect(screen.getByText('7 days and 6 hours of work')).toBeInTheDocument();
    expect(screen.getByText('36% of your monthly take home pay')).toBeInTheDocument();
  });

  it('shows the shortfall when fixed costs are more than take home pay', () => {
    render(<FixedCostsPage initialCosts={[{ ...insurance, amount: 3_400 }]} />);
    expect(screen.getByText('Short each month')).toBeInTheDocument();
    expect(screen.getByText('€400.00')).toBeInTheDocument();
    expect(
      screen.getByText('Your fixed costs are more than your take home pay.'),
    ).toBeInTheDocument();
  });

  it('stops adding at the limit', () => {
    const many = Array.from({ length: 50 }, (_, index) => ({ ...insurance, id: `${index}` }));
    render(<FixedCostsPage initialCosts={many} />);
    expect(screen.getByRole('button', { name: 'Add fixed cost' })).toBeDisabled();
    expect(screen.getByText('You can add up to 50 fixed costs.')).toBeInTheDocument();
  });
});
