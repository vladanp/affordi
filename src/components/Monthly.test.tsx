import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Bill } from '../domain/bills';
import type { FixedCost } from '../domain/fixedCosts';
import type { AffordiSettings } from '../domain/storage';
import { Monthly } from './Monthly';

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

const noFixedCosts: FixedCost[] = [];
const noBills: Bill[] = [];

interface PageProps {
  initialBills?: Bill[];
  initialCosts?: FixedCost[];
  initialSettings?: AffordiSettings;
}

/** Holds costs, bills, and settings the way the app does, so changes show on the page. */
function MonthlyPage({
  initialBills = noBills,
  initialCosts = noFixedCosts,
  initialSettings = settings,
}: PageProps) {
  const [bills, setBills] = useState(initialBills);
  const [costs, setCosts] = useState(initialCosts);
  const [current, setCurrent] = useState(initialSettings);
  return (
    <Monthly
      bills={bills}
      fixedCosts={costs}
      onBillsChange={setBills}
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

function fixedCostRows() {
  return within(screen.getByRole('list', { name: 'Fixed costs' })).getAllByRole('listitem');
}

function rows() {
  return fixedCostRows().map((row) => row.textContent);
}

/** The bill amount fields of the month shown, by bill name. */
function amount(name: string) {
  return screen.getByRole('textbox', { name });
}

function monthTitle() {
  return screen.getByRole('heading', { level: 3 }).textContent;
}

function monthTotal() {
  return document.querySelector('.bill-month-total')?.textContent;
}

describe('Monthly fixed costs', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 21, 12) }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('starts empty and adds a cost once the form is complete', () => {
    render(<MonthlyPage />);
    expect(
      screen.getByRole('heading', { name: 'What do you pay each month?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/like rent, loans, insurance, or subscriptions/)).toBeInTheDocument();
    expect(screen.queryByText('Each month')).not.toBeInTheDocument();

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
    expect(screen.getByRole('button', { name: 'Add fixed cost' })).toHaveFocus();
  });

  it('sums costs still paid, in work time and as a share of pay', () => {
    render(<MonthlyPage initialCosts={[insurance, carLoan, mortgage]} />);
    const total = screen.getByText('Each month').closest('div')!;
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
    render(<MonthlyPage initialCosts={[mortgage, insurance]} />);
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
      <MonthlyPage
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
    const meter = fixedCostRows()[0]!.querySelector<HTMLElement>('.meter > span');
    expect(meter?.style.inlineSize).toMatch(/^10\.89/);

    const loans = screen.getByText('Left to pay on loans').closest('div')!;
    expect(within(loans).getByText('€256,500.00')).toBeInTheDocument();
    expect(within(loans).getByText('€31,350.00 of €287,850.00 paid')).toBeInTheDocument();
    // Insurance keeps going without a last payment, so it is no loan; the car loan has ended.
    expect(within(loans).getByText('For Mortgage')).toBeInTheDocument();
    expect(within(loans).getByText('Last payment: March 2049')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(within(loans).getByText('10% paid')).toBeInTheDocument();
    expect(rows()[0]).toContain('10% paidLast payment: March 2049');
  });

  it('checks that the first payment comes no later than the last', () => {
    render(<MonthlyPage initialCosts={[{ ...mortgage, firstPayment: '2024-01' }]} />);
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
    render(<MonthlyPage initialCosts={[mortgage, insurance]} />);
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
    render(<MonthlyPage initialCosts={[carLoan]} />);
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
    render(<MonthlyPage initialCosts={[mortgage]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Mortgage' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(dialog().getByRole('heading', { name: 'Edit fixed cost' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides amounts but keeps work time and shares', () => {
    render(<MonthlyPage initialCosts={[mortgage, insurance]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    // Three cards and two rows.
    expect(screen.getAllByText('Hidden')).toHaveLength(3 + 2);
    expect(screen.getByText('7 days and 6 hours of work')).toBeInTheDocument();
    expect(screen.getByText('36% of your monthly take home pay')).toBeInTheDocument();
  });

  it('shows the shortfall when fixed costs are more than take home pay', () => {
    render(<MonthlyPage initialCosts={[{ ...insurance, amount: 3_400 }]} />);
    expect(screen.getByText('Short each month')).toBeInTheDocument();
    expect(screen.getByText('€400.00')).toBeInTheDocument();
    expect(
      screen.getByText('What you pay each month is more than your take home pay.'),
    ).toBeInTheDocument();
  });

  it('stops adding at the limit', () => {
    const many = Array.from({ length: 50 }, (_, index) => ({ ...insurance, id: `${index}` }));
    render(<MonthlyPage initialCosts={many} />);
    expect(screen.getByRole('button', { name: 'Add fixed cost' })).toBeDisabled();
    expect(screen.getByText('You can add up to 50 fixed costs.')).toBeInTheDocument();
  });
});

describe('Monthly bills', () => {
  beforeEach(() => vi.useFakeTimers({ now: new Date(2026, 9, 21, 12) }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('adds a bill with this month’s amount and takes the next one in its row', () => {
    render(<MonthlyPage />);
    expect(screen.getByText(/like electricity, water, or heating/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add bill' }));
    expect(dialog().getByRole('heading', { name: 'Add a bill' })).toBeInTheDocument();
    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount for October 2026' }), {
      target: { value: '0' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add bill' }));
    expect(dialog().getByText('Enter a name.')).toBeInTheDocument();
    expect(dialog().getByText('Enter an amount greater than 0.')).toBeInTheDocument();

    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Electricity' },
    });
    fireEvent.change(dialog().getByRole('textbox', { name: 'Amount for October 2026' }), {
      target: { value: '91' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add bill' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(monthTitle()).toBe('October 2026');
    expect(amount('Electricity')).toHaveValue('91.00');
    expect(monthTotal()).toBe('Total €91.00');
    expect(screen.getByRole('button', { name: 'Add bill' })).toHaveFocus();

    // A bill can start without an amount, which is then entered in the month.
    fireEvent.click(screen.getByRole('button', { name: 'Add bill' }));
    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Water' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Add bill' }));
    expect(amount('Water')).toHaveValue('');
    fireEvent.change(amount('Water'), { target: { value: '34' } });
    fireEvent.blur(amount('Water'));
    expect(amount('Water')).toHaveValue('34.00');
    expect(monthTotal()).toBe('Total €125.00');
    const total = screen.getByText('Each month').closest('div')!;
    expect(within(total).getByText('€125.00')).toBeInTheDocument();
  });

  it('shows one total with fixed costs and average bills, and what is left', () => {
    render(
      <MonthlyPage
        initialBills={[electricity, water]}
        initialCosts={[{ ...insurance, amount: 1_000 }]}
      />,
    );
    const total = screen.getByText('Each month').closest('div')!;
    expect(within(total).getByText('€1,127.25')).toBeInTheDocument();
    expect(within(total).getByText('8 days and 1 hour of work')).toBeInTheDocument();
    expect(
      within(total).getByText('Fixed costs €1,000.00 · Bills €127.25 on average'),
    ).toBeInTheDocument();
    const left = screen.getByText('Left each month').closest('div')!;
    expect(within(left).getByText('€1,872.75')).toBeInTheDocument();
    expect(within(left).getByText('€61.74 per day')).toBeInTheDocument();
    expect(screen.getByText('Average €95.25 · 4% below average')).toBeInTheDocument();
    expect(screen.getByText('Average €32.00 · 6% above average')).toBeInTheDocument();
  });

  it('steps through the months with the arrows and the chart', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    expect(monthTotal()).toBe('Total €125.00');
    expect(screen.getByRole('button', { name: 'Next month' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(monthTitle()).toBe('September 2026');
    expect(amount('Electricity')).toHaveValue('80.00');
    expect(amount('Water')).toHaveValue('30.00');

    const chart = screen.getByRole('group', { name: 'Bills per month' });
    fireEvent.keyDown(chart, { key: 'Home' });
    expect(monthTitle()).toBe('November 2025');
    expect(amount('Water')).toHaveValue('');
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(monthTitle()).toBe('December 2025');
    expect(monthTotal()).toBe('No amounts yet.');

    fireEvent.change(amount('Water'), { target: { value: '29.5' } });
    fireEvent.blur(amount('Water'));
    expect(amount('Water')).toHaveValue('29.50');
    expect(monthTotal()).toBe('Total €29.50');
  });

  it('picks any of the last twelve months from the list under the month’s name', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    const picker = screen.getByRole('combobox', { name: 'Choose a month' });
    const options = within(picker).getAllByRole('option');
    expect(options).toHaveLength(12);
    expect(options[0]).toHaveTextContent('October 2026');
    expect(options[1]).toHaveTextContent('September 2026');
    expect(options[2]).toHaveTextContent('August 2026 · no amounts');
    expect(options[11]).toHaveTextContent('November 2025');

    fireEvent.change(picker, { target: { value: '2026-01' } });
    expect(monthTitle()).toBe('January 2026');
    expect(amount('Electricity')).toHaveValue('120.00');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(picker).toHaveValue('2026-02');
  });

  it('points out an amount forgotten last month and opens that month to enter it', () => {
    const gas: Bill = { id: 'g', name: 'Gas', entries: [{ month: '2026-08', amount: 40 }] };
    render(<MonthlyPage initialBills={[electricity, water, gas]} />);
    expect(screen.getByText('No amount for September yet: Gas.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enter amounts' }));
    expect(monthTitle()).toBe('September 2026');
    expect(amount('Gas')).toHaveFocus();
    expect(screen.queryByText(/No amount for September/)).not.toBeInTheDocument();
    fireEvent.change(amount('Gas'), { target: { value: '38' } });
    fireEvent.blur(amount('Gas'));

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(monthTitle()).toBe('October 2026');
    expect(screen.queryByText(/No amount for/)).not.toBeInTheDocument();
  });

  it('enters an amount for an earlier month, clears one, and rejects one that is not a number', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(monthTitle()).toBe('August 2026');
    fireEvent.change(amount('Water'), { target: { value: '28' } });
    fireEvent.blur(amount('Water'));
    expect(monthTotal()).toBe('Total €28.00');

    fireEvent.change(amount('Water'), { target: { value: '' } });
    fireEvent.blur(amount('Water'));
    expect(monthTotal()).toBe('No amounts yet.');

    fireEvent.change(amount('Electricity'), { target: { value: 'lots' } });
    fireEvent.blur(amount('Electricity'));
    expect(amount('Electricity')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter an amount greater than 0.')).toBeInTheDocument();
    expect(monthTotal()).toBe('No amounts yet.');
    fireEvent.change(amount('Electricity'), { target: { value: '70' } });
    expect(amount('Electricity')).toHaveAttribute('aria-invalid', 'false');
  });

  it('moves on to the next bill with Enter', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    amount('Electricity').focus();
    fireEvent.keyDown(amount('Electricity'), { key: 'Enter' });
    expect(amount('Water')).toHaveFocus();
    fireEvent.keyDown(amount('Water'), { key: 'Enter' });
    expect(amount('Water')).not.toHaveFocus();
  });

  it('renames a bill and asks before deleting it with its amounts', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Water' }));
    expect(dialog().getByRole('heading', { name: 'Edit bill' })).toBeInTheDocument();
    expect(dialog().queryByRole('textbox', { name: /Amount/ })).not.toBeInTheDocument();
    fireEvent.change(dialog().getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Water and sewage' },
    });
    fireEvent.click(dialog().getByRole('button', { name: 'Save' }));
    expect(amount('Water and sewage')).toHaveValue('34.00');
    expect(screen.getByRole('button', { name: 'Edit Water and sewage' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Electricity' }));
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(dialog().getByRole('heading', { name: 'Delete Electricity?' })).toBeInTheDocument();
    expect(
      dialog().getByText('This removes the bill and all its amounts from this device.'),
    ).toBeInTheDocument();
    fireEvent.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('textbox', { name: 'Electricity' })).not.toBeInTheDocument();
    expect(monthTotal()).toBe('Total €34.00');
    expect(screen.getByRole('button', { name: 'Add bill' })).toHaveFocus();
  });

  it('masks amounts while hidden but keeps how a month compares', () => {
    render(<MonthlyPage initialBills={[electricity, water]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(screen.queryByText(/€\d/)).not.toBeInTheDocument();
    expect(amount('Electricity')).toHaveAttribute('data-masked', 'true');
    expect(screen.getByText('4% below average')).toBeInTheDocument();
    expect(screen.getByText('7 hours and 21 minutes of work')).toBeInTheDocument();
  });

  it('marks a bill without recent amounts and keeps it out of the average', () => {
    const old: Bill = { id: 'o', name: 'Old phone', entries: [{ month: '2024-05', amount: 50 }] };
    render(<MonthlyPage initialBills={[old, water]} />);
    expect(screen.getByText('No amounts in the last 12 months')).toBeInTheDocument();
    expect(amount('Old phone')).toHaveValue('');
    const total = screen.getByText('Each month').closest('div')!;
    expect(within(total).getByText('€32.00')).toBeInTheDocument();
  });
});
