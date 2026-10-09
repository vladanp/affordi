import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it('renders the setup flow for a first visit', () => {
    render(<App />);

    expect(screen.getByText('Affordi')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'See what things really cost in your time.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start calculating' })).toBeInTheDocument();
    const income = screen.getByLabelText('Take home income');
    expect(income).toHaveAttribute('type', 'text');
    expect(income).toHaveAttribute('data-masked', 'true');
    expect(income).toHaveValue('');
    expect(screen.getByText('Saved only on this device.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show income' }));
    expect(income).toHaveAttribute('data-masked', 'false');
    expect(screen.getByRole('button', { name: 'Hide income' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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
    expect(screen.getByText(/25\.0% of your monthly take home pay/)).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
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

  it('shows precise small percentages and dismisses the price input on submit', () => {
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

    expect(screen.getByText('<0.1% of your monthly take home pay')).toBeInTheDocument();
    fireEvent.submit(price.closest('form')!);
    expect(price).not.toHaveFocus();
  });

  it('rejects impossible work schedules during setup', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '3000' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Work hours each week' }), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Work days each week' }), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(screen.getByText('Use no more than 24 hours for each work day.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Work hours each week' })).toHaveFocus();

    fireEvent.change(screen.getByRole('textbox', { name: 'Work hours each week' }), {
      target: { value: '0.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(screen.getByText('Use between 1 and 168 hours each week.')).toBeInTheDocument();
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
      expect(screen.getByText('25.0% of your weekly take home pay')).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('');
      await act(() => vi.advanceTimersByTimeAsync(1_000));
      expect(liveRegion).toHaveTextContent(
        '$200.00 is 10 hours of work. ≈ 1 day and 2 hours. 25.0% of your weekly take home pay',
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
