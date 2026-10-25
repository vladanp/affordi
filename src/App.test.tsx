import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

const savedSettings = JSON.stringify({
  version: 1,
  settings: {
    netIncome: 3000,
    payFrequency: 'monthly',
    weeklyHours: 40,
    workingDaysPerWeek: 5,
    currency: 'EUR',
    language: 'en',
  },
});

/** The wrapper around every page, which says which way a page slides in. */
function shell() {
  return document.querySelector('.page');
}

describe('App', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
  });

  it('switches between cost and earnings and keeps the typed price', async () => {
    localStorage.setItem('affordi.settings.v1', savedSettings);
    render(<App />);
    const costLink = screen.getByRole('link', { name: 'Cost' });
    const earningsLink = screen.getByRole('link', { name: 'Earnings' });
    // The page slides in from the side of its tab once tabs change, and not on first paint.
    expect(shell()).not.toHaveAttribute('data-motion');
    expect(costLink).toHaveAttribute('aria-current', 'page');
    expect(earningsLink).not.toHaveAttribute('aria-current');
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '750' },
    });

    fireEvent.click(earningsLink);
    expect(
      await screen.findByRole('heading', { name: 'How much do you earn?' }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#earnings');
    expect(shell()).toHaveAttribute('data-motion', 'forward');
    expect(earningsLink).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe('Earnings · Affordi');
    expect(screen.queryByRole('heading', { name: 'How much does it cost?' })).toBeNull();
    expect(screen.getByText('Saved only on this device.')).toBeInTheDocument();

    fireEvent.click(costLink);
    expect(
      await screen.findByRole('heading', { name: 'How much does it cost?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Enter a price' })).toHaveValue('750');
    expect(shell()).toHaveAttribute('data-motion', 'back');
    expect(screen.getByText('43 hours of work')).toBeInTheDocument();
    expect(document.title).toBe('Affordi');
  });

  it('remembers hidden amounts across visits and settings changes', () => {
    localStorage.setItem('affordi.settings.v1', savedSettings);
    window.history.replaceState(null, '', '/#earnings');
    const first = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
    expect(screen.getByRole('button', { name: 'Show amounts' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('affordi.settings.v1') ?? '{}').settings).toMatchObject({
      hideAmounts: true,
    });
    first.unmount();

    render(<App />);
    expect(screen.getByRole('button', { name: 'Show amounts' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Show amounts' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
    expect(JSON.parse(localStorage.getItem('affordi.settings.v1') ?? '{}').settings).toMatchObject({
      hideAmounts: false,
    });
  });

  it('keeps fixed costs on the monthly page, saves them, and counts them on earnings', async () => {
    localStorage.setItem('affordi.settings.v1', savedSettings);
    // The fixed costs page had its own link before it joined the monthly page.
    window.history.replaceState(null, '', '/#fixed-costs');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'What do you pay each month?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Monthly' })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe('Monthly · Affordi');

    fireEvent.click(screen.getByRole('button', { name: 'Add fixed cost' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Name' }), { target: { value: 'Rent' } });
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount each month' }), {
      target: { value: '900' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Add' }));
    expect(
      JSON.parse(localStorage.getItem('affordi.fixedCosts.v1') ?? '{}').fixedCosts,
    ).toMatchObject([{ name: 'Rent', amount: 900, lastPayment: null }]);

    fireEvent.click(screen.getByRole('link', { name: 'Earnings' }));
    expect(await screen.findByText('Fixed costs this month')).toBeInTheDocument();
  });

  it('says when fixed costs could not be saved', () => {
    localStorage.setItem('affordi.settings.v1', savedSettings);
    window.history.replaceState(null, '', '/#bills');
    render(<App />);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add fixed cost' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Name' }), { target: { value: 'Rent' } });
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount each month' }), {
      target: { value: '900' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Add' }));
    setItem.mockRestore();
    expect(
      screen.getByText('Fixed costs are available for this visit, but could not be saved.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Rent' })).toBeInTheDocument();
  });

  it('opens earnings directly from its link', () => {
    localStorage.setItem('affordi.settings.v1', savedSettings);
    window.history.replaceState(null, '', '/#earnings');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'How much do you earn?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide amounts' })).toBeInTheDocument();
  });

  it('renders the setup flow for a first visit', () => {
    render(<App />);

    expect(screen.getByText('Affordi')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'See what things really cost in your time.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start calculating' })).toBeInTheDocument();
    const income = screen.getByLabelText('Take home income');
    expect(income).toHaveAttribute('type', 'text');
    expect(income).toHaveAttribute('data-masked', 'false');
    expect(income).toHaveValue('');
    expect(screen.getByText('Saved only on this device.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide income' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.change(income, { target: { value: '3000' } });
    income.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Hide income' }));
    const maskedIncome = screen.getByLabelText('Take home income');
    expect(maskedIncome).not.toBe(income);
    expect(maskedIncome).toHaveAttribute('data-masked', 'true');
    expect(maskedIncome).toHaveValue('3000');
    expect(maskedIncome).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Show income' }));
    expect(screen.getByLabelText('Take home income')).toHaveAttribute('data-masked', 'false');
  });

  it('validates setup and calculates immediately with comma decimals', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Take home income'), {
      target: { value: '3000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '750,00' },
    });
    expect(screen.getByText('43 hours of work')).toBeInTheDocument();
    expect(screen.getByText(/5 days and 3 hours/)).toBeInTheDocument();
    expect(screen.getByText(/25% of your monthly take home pay/)).toBeInTheDocument();
  });

  it('edits locale currency and resets only after inline confirmation', () => {
    const settings = {
      version: 1,
      settings: {
        netIncome: 3000,
        payFrequency: 'monthly',
        weeklyHours: 40,
        workingDaysPerWeek: 5,
        currency: 'USD',
      },
    };
    localStorage.setItem('affordi.settings.v1', JSON.stringify(settings));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'EUR' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('textbox', { name: 'Enter a price' })).toHaveValue('10');
    expect(screen.getByText(/€10/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    expect(screen.getByRole('heading', { name: 'Reset settings?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep settings' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Keep settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('button', { name: 'Start calculating' })).toBeInTheDocument();
  });

  it('keeps returning users on the calculator and recalculates after settings change', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    const first = render(<App />);
    expect(screen.getByRole('heading', { name: 'How much does it cost?' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '750' },
    });
    expect(screen.getByText('43 hours of work')).toBeInTheDocument();
    first.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'How much does it cost?' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '750' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByLabelText('Take home income'), {
      target: { value: '6000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('textbox', { name: 'Enter a price' })).toHaveValue('750');
    expect(screen.getByText('22 hours of work')).toBeInTheDocument();
  });

  it('previews theme changes and restores the saved theme when cancelled', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
          language: 'en',
          theme: 'dark',
        },
      }),
    );
    render(<App />);

    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'fr' },
    });
    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('previews language consistently and restores it when cancelled', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'EUR',
          language: 'en',
          theme: 'system',
        },
      }),
    );
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'fr' },
    });
    expect(document.documentElement.lang).toBe('fr');
    expect(screen.getByRole('heading', { name: 'Réglages' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus();
  });

  it('restores the system theme after resetting from a theme preview', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
          language: 'en',
          theme: 'system',
        },
      }),
    );
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    fireEvent.click(screen.getByRole('button', { name: /^Reset$/ }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('does not clear the app when storage refuses a reset', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('heading', { name: 'Reset settings?' })).toBeInTheDocument();
    expect(screen.getByText(/Could not clear saved settings/)).toBeInTheDocument();
    removeItem.mockRestore();
  });

  it('announces invalid price values and handles a free item', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    render(<App />);
    const price = screen.getByRole('textbox', { name: 'Enter a price' });
    fireEvent.change(price, { target: { value: '-1' } });
    expect(screen.getByText(/price of 0 or more/)).toBeInTheDocument();
    fireEvent.change(price, { target: { value: '0' } });
    expect(screen.getByText('0 minutes of work')).toBeInTheDocument();
    fireEvent.change(price, { target: { value: '9'.repeat(400) } });
    expect(screen.getByText(/price of 0 or more/)).toBeInTheDocument();
  });

  it('rounds the pay share to whole percentages', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    const { container } = render(<App />);
    const price = screen.getByRole('textbox', { name: 'Enter a price' });
    const segments = () => container.querySelectorAll('.share-segment');
    const multiple = () => container.querySelector('.share-multiple');

    fireEvent.change(price, { target: { value: '750' } });
    expect(segments()).toHaveLength(1);
    expect(multiple()).toBeNull();

    fireEvent.change(price, { target: { value: '11250' } });
    expect(screen.getByText('≈ 650 hours')).toBeInTheDocument();
    expect(screen.getByText('375% of your monthly take home pay')).toBeInTheDocument();
    expect(multiple()).toHaveTextContent('3.8×');
    expect(multiple()).toHaveAttribute('aria-hidden', 'true');
    expect(segments()).toHaveLength(4);

    fireEvent.change(price, { target: { value: '3030' } });
    expect(screen.getByText('101% of your monthly take home pay')).toBeInTheDocument();
    expect(segments()).toHaveLength(2);
    expect(multiple()).toBeNull();

    fireEvent.change(price, { target: { value: '3010' } });
    expect(screen.getByText('100% of your monthly take home pay')).toBeInTheDocument();
    expect(segments()).toHaveLength(1);

    fireEvent.change(price, { target: { value: '90000' } });
    expect(multiple()).toHaveTextContent('30×');
    expect(segments()).toHaveLength(12);

    fireEvent.change(price, { target: { value: '15' } });
    expect(screen.getByText('1% of your monthly take home pay')).toBeInTheDocument();
    fireEvent.change(price, { target: { value: '0' } });
    expect(screen.getByText('0% of your monthly take home pay')).toBeInTheDocument();
  });

  it('shows small percentages as under one percent and dismisses the price input on submit', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    render(<App />);
    const price = screen.getByRole('textbox', { name: 'Enter a price' });
    price.focus();
    fireEvent.change(price, { target: { value: '1' } });

    expect(screen.getByText('<1% of your monthly take home pay')).toBeInTheDocument();
    fireEvent.submit(price.closest('form')!);
    expect(price).not.toHaveFocus();
  });

  it('shows recurring prices per period with the other period as context', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
        },
      }),
    );
    render(<App />);
    const repeat = screen.getByRole('combobox', { name: 'How often you pay' });
    expect(repeat).toHaveValue('once');
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '300' },
    });
    expect(screen.getByText('$300.00 is')).toBeInTheDocument();
    expect(screen.queryByText(/Over a year/)).not.toBeInTheDocument();

    fireEvent.change(repeat, { target: { value: 'monthly' } });
    expect(screen.getByText('$300.00 a month is')).toBeInTheDocument();
    expect(screen.getByText('17 hours of work')).toBeInTheDocument();
    expect(screen.getByText('Over a year: 5 weeks and 1 day')).toBeInTheDocument();
    expect(screen.getByText('10% of your monthly take home pay')).toBeInTheDocument();

    fireEvent.change(repeat, { target: { value: 'yearly' } });
    expect(screen.getByText('$300.00 a year is')).toBeInTheDocument();
    expect(screen.getByText('Each month: 1 hour and 27 minutes')).toBeInTheDocument();
    expect(screen.getByText('1% of your yearly take home pay')).toBeInTheDocument();

    fireEvent.change(repeat, { target: { value: 'weekly' } });
    expect(screen.getByText('$300.00 a week is')).toBeInTheDocument();
    expect(screen.getByText('Over a year: 22 weeks and 3 days')).toBeInTheDocument();
    expect(screen.getByText('43% of your weekly take home pay')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '4.50' },
    });
    fireEvent.change(repeat, { target: { value: 'workday' } });
    expect(screen.getByText('$4.50 every workday is')).toBeInTheDocument();
    expect(screen.getByText('16 minutes of work')).toBeInTheDocument();
    expect(screen.getByText('Over a year: 68 hours')).toBeInTheDocument();
    expect(screen.getByText('3% of your monthly take home pay')).toBeInTheDocument();

    fireEvent.change(repeat, { target: { value: 'once' } });
    expect(screen.getByText('$4.50 is')).toBeInTheDocument();
    expect(screen.queryByText(/Over a year/)).not.toBeInTheDocument();
  });

  it('loads older saves from removed features and erases their data on reset', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          monthlySavings: 300,
          commuteMinutes: 60,
          monthlyWorkCosts: 300,
          currency: 'EUR',
          language: 'en',
          theme: 'system',
        },
      }),
    );
    localStorage.setItem(
      'affordi.checks.v1',
      JSON.stringify({
        version: 1,
        checks: [{ id: 'a', name: 'Gym', price: 40, repeat: 'monthly', currency: 'EUR' }],
      }),
    );
    localStorage.setItem(
      'affordi.fixedCosts.v1',
      JSON.stringify({
        version: 1,
        fixedCosts: [{ id: 'rent', name: 'Rent', amount: 900, lastPayment: null }],
      }),
    );
    localStorage.setItem(
      'affordi.bills.v1',
      JSON.stringify({
        version: 1,
        bills: [{ id: 'power', name: 'Power', entries: [{ month: '2026-09', amount: 80 }] }],
      }),
    );
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
      target: { value: '750' },
    });
    expect(screen.getByText('43 hours of work')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.queryByRole('textbox', { name: /savings|commute|costs/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(JSON.parse(localStorage.getItem('affordi.settings.v1') ?? '{}').settings).toEqual({
      netIncome: 3000,
      payFrequency: 'monthly',
      workStart: 540,
      workEnd: 1020,
      workDays: [1, 2, 3, 4, 5],
      weeklyHours: 40,
      workingDaysPerWeek: 5,
      currency: 'EUR',
      language: 'en',
      theme: 'system',
      hideAmounts: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    expect(
      screen.getByText(
        'This removes your income details, fixed costs, and bills from this device.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(localStorage.getItem('affordi.checks.v1')).toBeNull();
    expect(localStorage.getItem('affordi.fixedCosts.v1')).toBeNull();
    expect(localStorage.getItem('affordi.bills.v1')).toBeNull();
    expect(localStorage.getItem('affordi.settings.v1')).toBeNull();
    expect(screen.getByRole('button', { name: 'Start calculating' })).toBeInTheDocument();
  });

  it('rejects impossible work schedules during setup', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '3000' } });
    expect(screen.getByText('8 hours a day, 40 hours a week')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Work ends'), { target: { value: '08:00' } });
    expect(screen.queryByText(/a day, .* a week/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(screen.getByText('Choose an end time later the same day.')).toBeInTheDocument();
    expect(screen.getByLabelText('Work ends')).toHaveFocus();
    expect(screen.getByLabelText('Work ends')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText('Work ends'), { target: { value: '00:00' } });
    expect(screen.getByText('15 hours a day, 75 hours a week')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Work starts'), { target: { value: '' } });
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      fireEvent.click(screen.getByRole('checkbox', { name: day }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(screen.getByText('Choose when work starts.')).toBeInTheDocument();
    expect(screen.getByText('Choose at least one work day.')).toBeInTheDocument();
    expect(screen.getByLabelText('Work starts')).toHaveFocus();

    fireEvent.change(screen.getByLabelText('Work starts'), { target: { value: '22:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(screen.getByRole('checkbox', { name: 'Monday' })).toHaveFocus();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sunday' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Saturday' }));
    expect(screen.getByText('1 hour and 30 minutes a day, 3 hours a week')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(JSON.parse(localStorage.getItem('affordi.settings.v1') ?? '{}').settings).toMatchObject({
      workStart: 1350,
      workEnd: 1440,
      workDays: [0, 6],
      weeklyHours: 3,
      workingDaysPerWeek: 2,
    });
  });

  it('keeps unsaved edits and returns focus after declining a reset', () => {
    localStorage.setItem(
      'affordi.settings.v1',
      JSON.stringify({
        version: 1,
        settings: {
          netIncome: 3000,
          payFrequency: 'monthly',
          weeklyHours: 40,
          workingDaysPerWeek: 5,
          currency: 'USD',
          language: 'en',
          theme: 'system',
        },
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByLabelText('Take home income')).toHaveAttribute('data-masked', 'true');
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '4500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved settings' }));
    expect(screen.queryByRole('textbox', { name: 'Take home income' })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Take home income')).toHaveValue('4500');
    expect(screen.getByRole('button', { name: 'Reset saved settings' })).toHaveFocus();
  });

  it('compares hourly pay with a week and announces results after typing pauses', async () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem(
        'affordi.settings.v1',
        JSON.stringify({
          version: 1,
          settings: {
            netIncome: 20,
            payFrequency: 'hourly',
            weeklyHours: 40,
            workingDaysPerWeek: 5,
            currency: 'USD',
            language: 'en',
            theme: 'system',
          },
        }),
      );
      const { container } = render(<App />);
      const liveRegion = container.querySelector('[aria-live="polite"]');
      fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
        target: { value: '200' },
      });

      expect(screen.getByText('10 hours of work')).toBeInTheDocument();
      expect(screen.getByText('25% of your weekly take home pay')).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('');
      await act(() => vi.advanceTimersByTimeAsync(1_000));
      expect(liveRegion).toHaveTextContent(
        '$200.00 is 10 hours of work. ≈ 1 day and 2 hours. 25% of your weekly take home pay',
      );

      fireEvent.change(screen.getByRole('textbox', { name: 'Enter a price' }), {
        target: { value: 'abc' },
      });
      await act(() => vi.advanceTimersByTimeAsync(1_000));
      expect(liveRegion).toHaveTextContent('Enter a price of 0 or more.');
    } finally {
      vi.useRealTimers();
    }
  });
});
