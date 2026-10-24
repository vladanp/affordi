import { useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

import {
  billAmount,
  billStats,
  MAX_BILLS,
  summarizeBills,
  withBillAmount,
  withoutBillAmount,
  type Bill,
  type BillStats,
  type MonthTotal,
} from '../domain/bills';
import type { Translator } from '../domain/i18n';
import { formatDecimalInput, parseDecimalInput } from '../domain/input';
import { currencyDigits, formatCurrency, getCurrencySymbol } from '../domain/locale';
import { monthStart, parseMonth } from '../domain/months';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { BillDialog } from './BillDialog';
import { BillsChart } from './BillsChart';
import { FieldError } from './FieldError';
import { ListHeading, Money, useEditDialog } from './MonthlyCosts';

const MONTH_TITLE_ID = 'bill-month-title';

function monthDate(value: string): Date {
  const month = parseMonth(value);
  return month === null ? new Date(Number.NaN) : monthStart(month);
}

/** A bill's average, and how the month's amount compares with it. */
function averageNote(
  stats: BillStats,
  amount: number | null,
  hidden: boolean,
  settings: AffordiSettings,
  copy: Translator,
): string {
  if (stats.average === null) return copy.t('bills.noRecent');
  const parts = hidden
    ? []
    : [
        copy.t('bills.chartAverage', {
          amount: formatCurrency(stats.average, settings.currency, copy.locale),
        }),
      ];
  const change = amount === null ? 0 : amount / stats.average - 1;
  // A difference that rounds to a whole 0% is no difference worth naming.
  if (Math.round(Math.abs(change) * 100) > 0) {
    const percentage = formatIncomePercentage(Math.abs(change) * 100, copy.locale);
    parts.push(
      copy.t(change > 0 ? 'bills.above' : 'bills.below', {
        percentage: copy.t('fixedCosts.share', { percentage }),
      }),
    );
  }
  return parts.join(' · ');
}

/** Enter moves on to the next bill's amount, or leaves the last one. */
function moveToNextAmount(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const input = event.currentTarget;
  const inputs = [...(input.closest('ul')?.querySelectorAll('input') ?? [])];
  const next = inputs[inputs.indexOf(input) + 1];
  if (next === undefined) input.blur();
  else next.focus();
}

interface BillAmountRowProps {
  bill: Bill;
  copy: Translator;
  hidden: boolean;
  month: string;
  now: Date;
  onChange: (bill: Bill) => void;
  onEdit: (bill: Bill, opener: HTMLElement) => void;
  settings: AffordiSettings;
}

/** One bill with its amount for the month, saved when the field is left. */
function BillAmountRow({
  bill,
  copy,
  hidden,
  month,
  now,
  onChange,
  onEdit,
  settings,
}: BillAmountRowProps) {
  const saved = billAmount(bill, month);
  // Amounts read back with the currency's usual decimals, such as 91.00.
  const shown = (amount: number) =>
    formatDecimalInput(amount, copy.locale, currencyDigits(settings.currency, copy.locale));
  const [draft, setDraft] = useState(() => (saved === null ? '' : shown(saved)));
  const [error, setError] = useState(false);
  const id = `bill-amount-${bill.id}`;
  const note = averageNote(billStats(bill, now), saved, hidden, settings, copy);
  const describedBy = [note === '' ? '' : `${id}-note`, error ? `${id}-error` : '']
    .filter((part) => part !== '')
    .join(' ');

  function commit() {
    if (draft.trim() === '') {
      setError(false);
      if (saved !== null) onChange(withoutBillAmount(bill, month));
      return;
    }
    const amount = parseDecimalInput(draft, copy.locale);
    if (amount === null || amount <= 0) {
      setError(true);
      return;
    }
    setError(false);
    setDraft(shown(amount));
    if (amount !== saved) onChange(withBillAmount(bill, month, amount));
  }

  return (
    <li className="bill-row">
      <label className="bill-row-name" htmlFor={id}>
        {bill.name}
      </label>
      <button
        aria-label={copy.t('bills.edit', { name: bill.name })}
        className="icon-button bill-row-edit"
        onClick={(event) => onEdit(bill, event.currentTarget)}
        type="button"
      >
        <Pencil aria-hidden="true" size={16} strokeWidth={2} />
      </button>
      <span className="input-with-prefix bill-row-input">
        <span aria-hidden="true" className="input-prefix">
          {getCurrencySymbol(settings.currency, copy.locale)}
        </span>
        <input
          aria-describedby={describedBy === '' ? undefined : describedBy}
          aria-invalid={error}
          autoComplete="off"
          data-masked={hidden}
          enterKeyHint="next"
          id={id}
          inputMode="decimal"
          onBlur={commit}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(false);
          }}
          onKeyDown={moveToNextAmount}
          placeholder={copy.t('bills.amountLabel')}
          spellCheck={false}
          type="text"
          value={draft}
        />
      </span>
      {note !== '' && (
        <span className="bill-row-note" id={`${id}-note`}>
          {note}
        </span>
      )}
      <FieldError error={error ? copy.t('validation.costAmount') : undefined} id={`${id}-error`} />
    </li>
  );
}

interface BillMonthProps {
  bills: readonly Bill[];
  copy: Translator;
  hidden: boolean;
  index: number;
  now: Date;
  onBillChange: (bill: Bill) => void;
  onEdit: (bill: Bill, opener: HTMLElement) => void;
  onSelect: (index: number) => void;
  settings: AffordiSettings;
  totals: readonly MonthTotal[];
}

/** The bills of one month, entered together, with buttons that step through the months. */
function BillMonth({
  bills,
  copy,
  hidden,
  index,
  now,
  onBillChange,
  onEdit,
  onSelect,
  settings,
  totals,
}: BillMonthProps) {
  const current = totals[index]!;
  const first = index === 0;
  const last = index === totals.length - 1;
  return (
    <div className="bill-month">
      <div className="bill-month-head">
        {/* aria-disabled keeps focus on a button that reaches the end. */}
        <button
          aria-disabled={first || undefined}
          aria-label={copy.t('bills.previousMonth')}
          className="icon-button"
          onClick={() => !first && onSelect(index - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <h3 aria-live="polite" id={MONTH_TITLE_ID}>
          {copy.month(monthDate(current.month), true)}
        </h3>
        <button
          aria-disabled={last || undefined}
          aria-label={copy.t('bills.nextMonth')}
          className="icon-button"
          onClick={() => !last && onSelect(index + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <p className="bill-month-total" data-empty={current.total === null || undefined}>
          {current.total === null ? (
            copy.t('bills.noAmounts')
          ) : (
            <>
              <span className="visually-hidden">{copy.t('bills.total')} </span>
              <Money copy={copy} hidden={hidden} settings={settings} value={current.total} />
            </>
          )}
        </p>
      </div>
      <ul aria-labelledby={MONTH_TITLE_ID} className="bill-rows">
        {bills.map((bill) => (
          <BillAmountRow
            bill={bill}
            copy={copy}
            hidden={hidden}
            key={`${bill.id}:${current.month}`}
            month={current.month}
            now={now}
            onChange={onBillChange}
            onEdit={onEdit}
            settings={settings}
          />
        ))}
      </ul>
    </div>
  );
}

interface BillsSectionProps {
  bills: readonly Bill[];
  copy: Translator;
  hidden: boolean;
  now: Date;
  onBillsChange: (bills: Bill[]) => void;
  settings: AffordiSettings;
}

/**
 * Bills that change from month to month. The chart picks a month of the last year, and
 * the month's amounts are entered together below it.
 */
export function BillsSection({
  bills,
  copy,
  hidden,
  now,
  onBillsChange,
  settings,
}: BillsSectionProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialog = useEditDialog<Bill>(addButtonRef);
  const summary = summarizeBills(bills, now);
  const months = summary.totals.map(({ month }) => month);
  // The chosen month, until it leaves the last year; this month until one is chosen.
  const [chosen, setChosen] = useState<string | null>(null);
  const chosenIndex = chosen === null ? -1 : months.indexOf(chosen);
  const selected = chosenIndex === -1 ? months.length - 1 : chosenIndex;
  const month = months[selected]!;

  function select(index: number) {
    setChosen(months[index] ?? null);
  }

  function change(bill: Bill) {
    onBillsChange(bills.map((saved) => (saved.id === bill.id ? bill : saved)));
  }

  function save(bill: Bill) {
    const exists = bills.some((saved) => saved.id === bill.id);
    onBillsChange(
      exists ? bills.map((saved) => (saved.id === bill.id ? bill : saved)) : [...bills, bill],
    );
    dialog.close();
  }

  function remove(bill: Bill) {
    onBillsChange(bills.filter((saved) => saved.id !== bill.id));
    dialog.close();
  }

  return (
    <section aria-labelledby="bill-list-title" className="monthly-section bills">
      <ListHeading
        addButtonRef={addButtonRef}
        addLabel={copy.t('bills.add')}
        addShortLabel={copy.t('bills.addShort')}
        hint={copy.t('bills.hint')}
        id="bill-list-title"
        limitNote={bills.length >= MAX_BILLS ? copy.t('bills.limit', { count: MAX_BILLS }) : null}
        onAdd={(opener) => dialog.open(null, opener)}
        title={copy.t('bills.list')}
      />
      {bills.length > 0 && (
        <>
          <BillsChart
            copy={copy}
            currency={settings.currency}
            hidden={hidden}
            monthTitleId={MONTH_TITLE_ID}
            onSelect={select}
            selected={selected}
            summary={summary}
          />
          <BillMonth
            bills={bills}
            copy={copy}
            hidden={hidden}
            index={selected}
            now={now}
            onBillChange={change}
            onEdit={dialog.open}
            onSelect={select}
            settings={settings}
            totals={summary.totals}
          />
        </>
      )}

      {dialog.editing !== undefined && (
        <BillDialog
          bill={dialog.editing}
          copy={copy}
          currency={settings.currency}
          month={month}
          onClose={dialog.close}
          onDelete={remove}
          onSave={save}
        />
      )}
    </section>
  );
}
