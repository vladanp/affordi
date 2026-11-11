import { act, cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { createBackup } from '../domain/backup';
import { createTranslator } from '../domain/i18n';
import { defaultSettings, loadSettings, saveSettings } from '../domain/storage';
import { DataDialog } from './DataDialog';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function saved() {
  saveSettings({ ...defaultSettings(), currency: 'EUR' });
}
function openSettings() {
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
}

describe('review interaction regressions', () => {
  it('preserves income and an entered price while changing language, and translates existing errors', () => {
    saved();
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'How much does it cost?' }), {
      target: { value: '1,000' },
    });
    openSettings();
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '3,000' } });
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'de' } });
    expect(screen.getByLabelText('Nettoeinkommen')).toHaveValue('3000');
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(loadSettings()?.netIncome).toBe(3000);
    expect(screen.getByRole('textbox', { name: 'Was kostet es an Zeit?' })).toHaveValue('1000');
    expect(document.querySelector('.result-primary')).toHaveTextContent('58');
    fireEvent.click(screen.getByRole('button', { name: 'Einstellungen' }));
    fireEvent.change(screen.getByLabelText('Nettoeinkommen'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    fireEvent.change(screen.getByLabelText('Sprache'), { target: { value: 'en' } });
    expect(screen.getByText('Enter an income greater than 0.')).toBeInTheDocument();
  });
  it('requires explicit denomination confirmation, and cancellation retains the draft', () => {
    saved();
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('radio', { name: 'RSD' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(loadSettings()?.currency).toBe('EUR');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('radio', { name: 'RSD' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change denomination' }));
    expect(loadSettings()?.currency).toBe('RSD');
  });
  it('refreshes another tab’s settings and lists, and follows a reset', async () => {
    saved();
    render(<App />);
    openSettings();
    const latest = { ...loadSettings()!, netIncome: 4500 };
    saveSettings(latest);
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'affordi.settings.v1' }));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(loadSettings()?.netIncome).toBe(4500);
    localStorage.clear();
    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(screen.getByRole('button', { name: 'Start calculating' })).toBeInTheDocument();
  });
  it('supports a budget scenario without claiming a purchase is affordable when nothing is left', () => {
    saved();
    localStorage.setItem(
      'affordi.fixedCosts.v1',
      JSON.stringify({
        version: 1,
        fixedCosts: [
          { id: 'r', name: 'Rent', amount: 3000, firstPayment: null, lastPayment: null },
        ],
      }),
    );
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: 'How much does it cost?' }), {
      target: { value: '750' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use pay left after bills' }));
    expect(screen.getByText('No pay left after monthly costs')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use pay left after bills' }));
    expect(document.querySelector('.result-primary')).toHaveTextContent('43 hours');
  });
  it('saves a paid overnight schedule and custom weekday hours', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '3000' } });
    fireEvent.change(screen.getByLabelText('Work starts'), { target: { value: '22:00' } });
    fireEvent.change(screen.getByLabelText('Work ends'), { target: { value: '06:00' } });
    fireEvent.change(screen.getByLabelText('Unpaid break (minutes)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(loadSettings()?.weeklyHours).toBe(37.5);
    openSettings();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Different hours by day' }));
    const monday = within(screen.getByRole('group', { name: 'Monday' }));
    fireEvent.change(monday.getByLabelText('Work starts'), { target: { value: '21:00' } });
    fireEvent.change(monday.getByLabelText('Unpaid break (minutes)'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(loadSettings()?.workSessions?.find((s) => s.day === 1)?.workStart).toBe(1260);
  });
});

describe('custom schedule setup', () => {
  it('copies uniform edits into day controls and validates the visible overrides', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Take home income'), { target: { value: '3000' } });
    for (const day of ['Tuesday', 'Wednesday', 'Thursday', 'Friday'])
      fireEvent.click(screen.getByRole('checkbox', { name: day }));
    fireEvent.change(screen.getByLabelText('Work starts'), { target: { value: '22:00' } });
    fireEvent.change(screen.getByLabelText('Work ends'), { target: { value: '06:00' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Different hours by day' }));
    const monday = within(screen.getByRole('group', { name: 'Monday' }));
    expect(monday.getByLabelText('Work starts')).toHaveValue('22:00');
    fireEvent.change(monday.getByLabelText('Work starts'), { target: { value: '10:00' } });
    fireEvent.change(monday.getByLabelText('Work ends'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start calculating' }));
    expect(loadSettings()).toMatchObject({ workStart: 600, workEnd: 1080, weeklyHours: 8 });
  });
});

describe('backup review dialog', () => {
  it('shows on-device privacy before setup and disables export without data', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'On this device' }));
    expect(screen.getByText(/No accounts, tracking or cloud storage/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('downloads an on-device backup and asks before replacing data', async () => {
    saved();
    const backup = { ...createBackup()!, settings: { ...loadSettings()!, netIncome: 5000 } };
    const onClose = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn(() => 'blob:backup');
        static override revokeObjectURL = vi.fn();
      },
    );
    render(<DataDialog copy={createTranslator('en')} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect(click).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Import backup' }));
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(JSON.stringify(backup)) });
    fireEvent.change(screen.getByLabelText('Import backup'), { target: { files: [file] } });
    await screen.findByRole('button', { name: 'Replace data' });
    expect(loadSettings()?.netIncome).toBe(3000);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.change(screen.getByLabelText('Import backup'), { target: { files: [file] } });
    await screen.findByRole('button', { name: 'Replace data' });
    fireEvent.click(screen.getByRole('button', { name: 'Replace data' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(loadSettings()?.netIncome).toBe(5000);
    vi.unstubAllGlobals();
  });
  it('rejects an invalid backup without touching saved data', async () => {
    saved();
    render(<DataDialog copy={createTranslator('en')} onClose={vi.fn()} />);
    const file = new File(['{}'], 'bad.json');
    Object.defineProperty(file, 'text', { value: () => Promise.resolve('{}') });
    fireEvent.change(screen.getByLabelText('Import backup'), { target: { files: [file] } });
    expect(await screen.findByRole('status')).toHaveTextContent('Could not import');
    expect(loadSettings()?.netIncome).toBe(3000);
  });
});

function selectedBillMonth() {
  return document.querySelector('#bill-month-title')?.textContent;
}

describe('chart gesture intent', () => {
  it('ignores vertical pans and hover but accepts deliberate horizontal selection', async () => {
    vi.stubGlobal('PointerEvent', MouseEvent);
    saved();
    localStorage.setItem(
      'affordi.bills.v1',
      JSON.stringify({ version: 1, bills: [{ id: 'b', name: 'Power', entries: [] }] }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Monthly' }));
    await screen.findByRole('heading', { name: 'What do you pay each month?' });
    const disclosure = document.querySelector<HTMLDetailsElement>('.bills-chart-disclosure')!;
    fireEvent.click(disclosure.querySelector('summary')!);
    const chart = screen.getByRole('group', { name: 'Bills per month' });
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 120, 200));
    const before = selectedBillMonth();
    fireEvent.pointerMove(chart, { clientX: 5, clientY: 100, buttons: 0 });
    expect(selectedBillMonth()).toBe(before);
    fireEvent.pointerDown(chart, { clientX: 5, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(chart, { clientX: 7, clientY: 140, buttons: 1 });
    fireEvent.pointerUp(chart, { clientX: 7, clientY: 140 });
    expect(selectedBillMonth()).toBe(before);
    fireEvent.pointerDown(chart, { clientX: 5, clientY: 100, buttons: 1 });
    fireEvent.pointerMove(chart, { clientX: 65, clientY: 102, buttons: 1 });
    fireEvent.pointerUp(chart, { clientX: 65, clientY: 102 });
    expect(selectedBillMonth()).not.toBe(before);
    fireEvent.pointerDown(chart, { clientX: 5, clientY: 100, buttons: 1 });
    fireEvent.pointerCancel(chart);
  });
});
