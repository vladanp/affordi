import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

import { withBillAmount, type Bill, type BillEntry } from '../domain/bills';
import type { Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { createItemId, isItemName } from '../domain/items';
import { formatCurrency, type CurrencyCode } from '../domain/locale';
import { monthOf, monthStart, monthValue, parseMonth, recentMonths } from '../domain/months';
import {
  AmountField,
  DeleteConfirmation,
  FormActions,
  NameField,
  SheetDialog,
} from './SheetDialog';

/** Amounts can be entered for this month and the two years before it. */
const CHOOSABLE_MONTHS = 24;

interface FormValues {
  name: string;
  month: string;
  amount: string;
}

type FormErrors = Partial<Record<'name' | 'amount', string>>;

function monthLabel(value: string, copy: Translator): string {
  const month = parseMonth(value);
  return month === null ? value : copy.month(monthStart(month), true);
}

/**
 * The amount to save, null when an edit leaves it empty, or undefined when it is missing or not
 * valid. A new bill needs an amount; an edit may change only the name or the saved amounts.
 */
function readAmount(value: string, adding: boolean, locale: string): number | null | undefined {
  if (value.trim() === '') return adding ? undefined : null;
  const amount = parseDecimalInput(value, locale);
  return amount !== null && amount > 0 ? amount : undefined;
}

/** Checks the form and builds the bill. */
function validate(
  values: FormValues,
  bill: Bill | null,
  entries: BillEntry[],
  copy: Translator,
): { bill?: Bill; errors: FormErrors } {
  const errors: FormErrors = {};
  const name = values.name.trim();
  const amount = readAmount(values.amount, bill === null, copy.locale);
  if (!isItemName(name)) errors.name = copy.t('validation.costName');
  if (amount === undefined) errors.amount = copy.t('validation.costAmount');
  if (amount === undefined || errors.name !== undefined) return { errors };

  const saved: Bill = { id: bill?.id ?? createItemId(), name, entries };
  return { errors, bill: amount === null ? saved : withBillAmount(saved, values.month, amount) };
}

interface HistoryProps {
  copy: Translator;
  currency: CurrencyCode;
  entries: BillEntry[];
  onRemove: (month: string) => void;
}

/** Saved amounts, newest first, each with a button that removes it once the bill is saved. */
function History({ copy, currency, entries, onRemove }: HistoryProps) {
  return (
    <section aria-labelledby="bill-history-title" className="bill-history form-wide">
      <h3 id="bill-history-title">{copy.t('bills.history')}</h3>
      {entries.length === 0 ? (
        <p className="field-hint">{copy.t('bills.noAmounts')}</p>
      ) : (
        <ul>
          {entries.toReversed().map((entry) => {
            const month = monthLabel(entry.month, copy);
            return (
              <li key={entry.month}>
                <span>{month}</span>
                <span className="bill-history-amount">
                  {formatCurrency(entry.amount, currency, copy.locale)}
                </span>
                <button
                  aria-label={copy.t('bills.removeAmount', { month })}
                  className="icon-button bill-history-remove"
                  onClick={() => onRemove(entry.month)}
                  type="button"
                >
                  <X aria-hidden="true" size={16} strokeWidth={2} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface BillFormProps {
  bill: Bill | null;
  copy: Translator;
  currency: CurrencyCode;
  hidden: boolean;
  now: Date;
  onCancel: () => void;
  onDeleteRequest: () => void;
  onSave: (bill: Bill) => void;
}

/** The fields of a bill. It stays mounted while deletion is confirmed, so edits survive Keep. */
function BillForm({
  bill,
  copy,
  currency,
  hidden,
  now,
  onCancel,
  onDeleteRequest,
  onSave,
}: BillFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    name: bill?.name ?? '',
    month: monthValue(monthOf(now)),
    amount: '',
  }));
  const [entries, setEntries] = useState<BillEntry[]>(() => bill?.entries ?? []);
  const [errors, setErrors] = useState<FormErrors>({});
  const savedAmount = entries.find((entry) => entry.month === values.month)?.amount ?? null;
  const months = recentMonths(now, CHOOSABLE_MONTHS).map(monthValue).toReversed();

  function update(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (name !== 'month') setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(values, bill, entries, copy);
    setErrors(result.errors);
    if (result.bill !== undefined) {
      onSave(result.bill);
      return;
    }
    const control = event.currentTarget.elements.namedItem(
      result.errors.name === undefined ? 'amount' : 'name',
    );
    if (control instanceof HTMLElement) control.focus();
  }

  return (
    <form className="income-form item-form" hidden={hidden} noValidate onSubmit={handleSubmit}>
      <div className="form-wide">
        <NameField
          copy={copy}
          error={errors.name}
          onChange={(value) => update('name', value)}
          placeholder={copy.t('bills.namePlaceholder')}
          value={values.name}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="bill-month">
          {copy.t('bills.monthLabel')}
        </label>
        <span className="select-wrap">
          <select
            id="bill-month"
            name="month"
            onChange={(event) => update('month', event.target.value)}
            value={values.month}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month, copy)}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="select-chevron" />
        </span>
      </div>
      <AmountField
        copy={copy}
        currency={currency}
        error={errors.amount}
        hint={
          savedAmount === null
            ? null
            : copy.t('bills.replaces', {
                amount: formatCurrency(savedAmount, currency, copy.locale),
              })
        }
        label={copy.t('bills.amountLabel')}
        onChange={(value) => update('amount', value)}
        placeholder="85"
        value={values.amount}
      />
      {bill !== null && (
        <History
          copy={copy}
          currency={currency}
          entries={entries}
          onRemove={(month) => setEntries((current) => current.filter((e) => e.month !== month))}
        />
      )}
      <FormActions
        copy={copy}
        onCancel={onCancel}
        onDeleteRequest={bill === null ? null : onDeleteRequest}
        submitLabel={copy.t(bill === null ? 'bills.add' : 'fixedCosts.save')}
      />
    </form>
  );
}

interface BillDialogProps {
  /** The bill to edit, or null to add a new one. */
  bill: Bill | null;
  copy: Translator;
  currency: CurrencyCode;
  now: Date;
  onClose: () => void;
  onDelete: (bill: Bill) => void;
  onSave: (bill: Bill) => void;
}

export function BillDialog({
  bill,
  copy,
  currency,
  now,
  onClose,
  onDelete,
  onSave,
}: BillDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  let title = copy.t('bills.addTitle');
  if (bill !== null) {
    title = confirmDelete ? copy.t('fixedCosts.deleteTitle', { name: bill.name }) : bill.name;
  }

  return (
    <SheetDialog
      closeLabel={copy.t('fixedCosts.close')}
      onBack={confirmDelete ? () => setConfirmDelete(false) : null}
      onClose={onClose}
      title={title}
    >
      {confirmDelete && bill !== null && (
        <DeleteConfirmation
          copy={copy}
          description={copy.t('bills.deleteDescription')}
          onDelete={() => onDelete(bill)}
          onKeep={() => setConfirmDelete(false)}
        />
      )}
      <BillForm
        bill={bill}
        copy={copy}
        currency={currency}
        hidden={confirmDelete}
        now={now}
        onCancel={onClose}
        onDeleteRequest={() => setConfirmDelete(true)}
        onSave={onSave}
      />
    </SheetDialog>
  );
}
