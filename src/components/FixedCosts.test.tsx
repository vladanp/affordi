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
const mortgage: FixedCost = {
  id: 'a',
  name: 'Mortgage',
  amount: 950,
  firstPayment: null,
  lastPayment: '2049-03',
};
const insurance: FixedCost = {
  id: 'b',
  name: 'Insurance',
  amount: 120,
  firstPayment: null,
  lastPayment: null,
};
const carLoan: FixedCost = {
  id: 'c',
  name: 'Car loan',
  amount: 380,
  firstPayment: null,
  lastPayment: '2026-09',
};

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

/** The month and year lists of the first or last payment. */
function payment(which: 'First payment' | 'Last payment') {
  return within(dialog().getByRole('group', { name: which }));
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
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Month' }), {
      target: { value: '3' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add fixed cost' }));
    expect(
      dialog().getByText('Choose a month and a year, or leave both empty.'),
    ).toBeInTheDocument();
    expect(payment('Last payment').getByRole('combobox', { name: 'Month' })).toHaveFocus();

    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Year' }), {
      target: { value: '2049' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add fixed cost' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()).toEqual([
      'Mortgage€950.006 days and 7 hours of work32%32% of your pay€256,500.00 left to payLast payment: March 2049',
    ]);
    expect(screen.getByText('€2,050.00')).toBeInTheDocument();
    expect(screen.getByText('€67.58 per day')).toBeInTheDocument();
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
      'Mortgage€950.006 days and 7 hours of work32%32% of your pay€256,500.00 left to payLast payment: March 2049',
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
    expect(payment('Last payment').getByRole('combobox', { name: 'Month' })).toHaveValue('3');
    expect(payment('Last payment').getByRole('combobox', { name: 'Year' })).toHaveValue('2049');

    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount each month' }), {
      target: { value: '900.5' },
    });
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Month' }), {
      target: { value: '' },
    });
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Year' }), {
      target: { value: '' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rows()[0]).toBe('Mortgage€900.506 days and 4 hours of work30%30% of your pay');
    expect(edit).toHaveFocus();
  });

  it('shows what is paid and left on loans with a first payment', () => {
    render(
      <FixedCostsPage
        initialCosts={[
          { ...mortgage, firstPayment: '2024-01' },
          { ...insurance, firstPayment: '2026-01' },
          { ...carLoan, firstPayment: '2024-10' },
        ]}
      />,
    );
    // January 2024 through September 2026 are paid; October 2026 through March 2049 are left.
    expect(rows()).toEqual([
      'Mortgage€950.006 days and 7 hours of work32%32% of your pay€31,350.00 paid · €256,500.00 leftLast payment: March 2049',
      'Insurance€120.006 hours and 56 minutes of work4%4% of your pay€1,080.00 paid so far',
      'Car loan€380.00Ended€9,120.00 paid in totalLast payment: September 2026',
    ]);
    const meter = screen.getAllByRole('listitem')[0]!.querySelector<HTMLElement>('.meter > span');
    expect(meter?.style.inlineSize).toMatch(/^10\.89/);

    const loans = screen.getByText('Left to pay on loans').closest('div')!;
    expect(within(loans).getByText('€256,500.00')).toBeInTheDocument();
    expect(within(loans).getByText('€31,350.00 of €287,850.00 paid')).toBeInTheDocument();
    expect(within(loans).getByText('Last payment: March 2049')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(within(loans).getByText('10% paid')).toBeInTheDocument();
    expect(rows()[0]).toContain('10% paidLast payment: March 2049');
  });

  it('checks that the first payment comes no later than the last', () => {
    render(<FixedCostsPage initialCosts={[{ ...mortgage, firstPayment: '2024-01' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Mortgage' }));
    expect(payment('First payment').getByRole('combobox', { name: 'Month' })).toHaveValue('1');
    expect(payment('First payment').getByRole('combobox', { name: 'Year' })).toHaveValue('2024');

    fireEvent.change(payment('First payment').getByRole('combobox', { name: 'Year' }), {
      target: { value: '2027' },
    });
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Year' }), {
      target: { value: '2026' },
    });
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Month' }), {
      target: { value: '12' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(
      dialog().getByText('Choose a month no later than the last payment.'),
    ).toBeInTheDocument();
    expect(payment('First payment').getByRole('combobox', { name: 'Month' })).toHaveFocus();

    fireEvent.change(payment('First payment').getByRole('combobox', { name: 'Year' }), {
      target: { value: '2026' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // January to September 2026 are paid, October to December are left.
    expect(rows()[0]).toContain('€8,550.00 paid · €2,850.00 leftLast payment: December 2026');
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
    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Month' }), {
      target: { value: '8' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(dialog().getByText('Choose this month or later.')).toBeInTheDocument();

    fireEvent.change(payment('Last payment').getByRole('combobox', { name: 'Month' }), {
      target: { value: '9' },
    });
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
    // Three cards and two rows.
    expect(screen.getAllByText('Hidden')).toHaveLength(3 + 2);
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
