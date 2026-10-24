import { useState, type FormEvent, type KeyboardEvent, type SyntheticEvent } from 'react';
import { X } from 'lucide-react';

import {
  createFixedCostId,
  isFixedCostName,
  isMonthBefore,
  MAX_FIXED_COST_NAME_LENGTH,
  monthStart,
  monthValue,
  parseMonth,
  type FixedCost,
} from '../domain/fixedCosts';
import type { Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { getCurrencySymbol, type CurrencyCode } from '../domain/locale';
import { FieldError } from './FieldError';

/** Mortgages run for decades, so the year list reaches this far ahead. */
const YEARS_AHEAD = 50;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

interface FormValues {
  name: string;
  amount: string;
  month: string;
  year: string;
}

type FormErrors = Partial<Record<'name' | 'amount' | 'lastPayment', string>>;

/** Controls in the order they appear, so focus lands on the first problem. */
const errorControls = [
  ['name', 'name'],
  ['amount', 'amount'],
  ['lastPayment', 'month'],
] as const satisfies readonly (readonly [keyof FormErrors, keyof FormValues])[];

function openAsModal(node: HTMLDialogElement | null) {
  if (node === null || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}

function initialValues(cost: FixedCost | null, locale: string): FormValues {
  if (cost === null) return { name: '', amount: '', month: '', year: '' };
  const last = cost.lastPayment === null ? null : parseMonth(cost.lastPayment);
  return {
    name: cost.name,
    amount: cost.amount.toLocaleString(locale, { maximumFractionDigits: 6, useGrouping: false }),
    month: last === null ? '' : String(last.month),
    year: last === null ? '' : String(last.year),
  };
}

interface LastPaymentResult {
  lastPayment: string | null;
  error?: string;
}

/** Both parts of the last payment or neither, and not in the past unless it was saved that way. */
function readLastPayment(
  values: FormValues,
  cost: FixedCost | null,
  now: Date,
  copy: Translator,
): LastPaymentResult {
  if (values.month === '' && values.year === '') return { lastPayment: null };
  if (values.month === '' || values.year === '') {
    return { lastPayment: null, error: copy.t('validation.lastPayment') };
  }

  const month = { year: Number(values.year), month: Number(values.month) };
  const lastPayment = monthValue(month);
  if (isMonthBefore(month, now) && lastPayment !== cost?.lastPayment) {
    return { lastPayment, error: copy.t('validation.lastPaymentPast') };
  }
  return { lastPayment };
}

function validate(
  values: FormValues,
  cost: FixedCost | null,
  now: Date,
  copy: Translator,
): { cost?: FixedCost; errors: FormErrors } {
  const errors: FormErrors = {};
  const name = values.name.trim();
  const amount = parseDecimalInput(values.amount, copy.locale);
  const { lastPayment, error } = readLastPayment(values, cost, now, copy);
  if (!isFixedCostName(name)) errors.name = copy.t('validation.costName');
  if (amount === null || amount <= 0) errors.amount = copy.t('validation.costAmount');
  if (error !== undefined) errors.lastPayment = error;

  if (amount === null || Object.keys(errors).length > 0) return { errors };
  return { errors, cost: { id: cost?.id ?? createFixedCostId(), name, amount, lastPayment } };
}

function focusFirstError(form: HTMLFormElement, errors: FormErrors) {
  const first = errorControls.find(([field]) => errors[field] !== undefined);
  const control = first === undefined ? null : form.elements.namedItem(first[1]);
  if (control instanceof HTMLElement) control.focus();
}

/** Years from this one, or from a saved earlier year, to decades ahead. */
function yearOptions(now: Date, savedYear: string): number[] {
  const thisYear = now.getFullYear();
  const firstYear = Math.min(thisYear, Number(savedYear) || thisYear);
  return Array.from(
    { length: thisYear + YEARS_AHEAD - firstYear + 1 },
    (_, index) => firstYear + index,
  );
}

interface LastPaymentFieldProps {
  copy: Translator;
  error: string | undefined;
  now: Date;
  onChange: (name: 'month' | 'year', value: string) => void;
  values: FormValues;
}

/** An optional month and year, chosen from lists because month inputs are missing in some browsers. */
function LastPaymentField({ copy, error, now, onChange, values }: LastPaymentFieldProps) {
  const describedBy =
    error === undefined ? 'last-payment-hint' : 'last-payment-hint last-payment-error';
  return (
    <fieldset aria-describedby={describedBy} className="field form-wide">
      <legend className="field-label">{copy.t('fixedCosts.lastPaymentLabel')}</legend>
      <div className="month-year">
        <span className="select-wrap">
          <select
            aria-invalid={error !== undefined}
            aria-label={copy.t('fixedCosts.month')}
            name="month"
            onChange={(event) => onChange('month', event.target.value)}
            value={values.month}
          >
            <option value="">{copy.t('fixedCosts.month')}</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {copy.month(monthStart({ year: now.getFullYear(), month }), false)}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="select-chevron" />
        </span>
        <span className="select-wrap">
          <select
            aria-invalid={error !== undefined}
            aria-label={copy.t('fixedCosts.year')}
            name="year"
            onChange={(event) => onChange('year', event.target.value)}
            value={values.year}
          >
            <option value="">{copy.t('fixedCosts.year')}</option>
            {yearOptions(now, values.year).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="select-chevron" />
        </span>
      </div>
      <small className="field-hint" id="last-payment-hint">
        {copy.t('fixedCosts.lastPaymentHint')}
      </small>
      <FieldError error={error} id="last-payment-error" />
    </fieldset>
  );
}

interface FixedCostFormProps {
  copy: Translator;
  cost: FixedCost | null;
  currency: CurrencyCode;
  hidden: boolean;
  now: Date;
  onCancel: () => void;
  onDeleteRequest: () => void;
  onSave: (cost: FixedCost) => void;
}

/** The fields of a cost. It stays mounted while deletion is confirmed, so edits survive Keep. */
function FixedCostForm({
  copy,
  cost,
  currency,
  hidden,
  now,
  onCancel,
  onDeleteRequest,
  onSave,
}: FixedCostFormProps) {
  const [values, setValues] = useState(() => initialValues(cost, copy.locale));
  const [errors, setErrors] = useState<FormErrors>({});

  function update(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    const field = name === 'month' || name === 'year' ? 'lastPayment' : name;
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(values, cost, now, copy);
    setErrors(result.errors);
    if (result.cost === undefined) focusFirstError(event.currentTarget, result.errors);
    else onSave(result.cost);
  }

  return (
    <form
      className="income-form fixed-cost-form"
      hidden={hidden}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="field">
        <label className="field-label" htmlFor="fixed-cost-name">
          {copy.t('fixedCosts.nameLabel')}
        </label>
        <input
          aria-describedby={errors.name === undefined ? undefined : 'fixed-cost-name-error'}
          aria-invalid={errors.name !== undefined}
          autoComplete="off"
          enterKeyHint="next"
          id="fixed-cost-name"
          maxLength={MAX_FIXED_COST_NAME_LENGTH}
          name="name"
          onChange={(event) => update('name', event.target.value)}
          placeholder={copy.t('fixedCosts.namePlaceholder')}
          type="text"
          value={values.name}
        />
        <FieldError error={errors.name} id="fixed-cost-name-error" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="fixed-cost-amount">
          {copy.t('fixedCosts.amountLabel')}
        </label>
        <span className="input-with-prefix">
          <span aria-hidden="true" className="input-prefix">
            {getCurrencySymbol(currency, copy.locale)}
          </span>
          <input
            aria-describedby={
              errors.amount === undefined
                ? 'fixed-cost-currency'
                : 'fixed-cost-currency fixed-cost-amount-error'
            }
            aria-invalid={errors.amount !== undefined}
            autoComplete="off"
            enterKeyHint="next"
            id="fixed-cost-amount"
            inputMode="decimal"
            name="amount"
            onChange={(event) => update('amount', event.target.value)}
            placeholder="950"
            spellCheck={false}
            type="text"
            value={values.amount}
          />
        </span>
        <small className="visually-hidden" id="fixed-cost-currency">
          {copy.t('fixedCosts.amountDescription', { currency })}
        </small>
        <FieldError error={errors.amount} id="fixed-cost-amount-error" />
      </div>
      <LastPaymentField
        copy={copy}
        error={errors.lastPayment}
        now={now}
        onChange={update}
        values={values}
      />
      <div className="form-actions form-wide">
        {cost !== null && (
          <button className="text-button delete-button" onClick={onDeleteRequest} type="button">
            {copy.t('fixedCosts.delete')}
          </button>
        )}
        <button className="button button-quiet" onClick={onCancel} type="button">
          {copy.t('form.cancel')}
        </button>
        <button className="button button-primary" type="submit">
          {copy.t(cost === null ? 'fixedCosts.add' : 'fixedCosts.save')}
        </button>
      </div>
    </form>
  );
}

interface DeleteConfirmationProps {
  copy: Translator;
  onDelete: () => void;
  onKeep: () => void;
}

/** Moves focus to the safe choice when the question appears. A stable callback runs only once. */
function focusOnMount(node: HTMLButtonElement | null) {
  node?.focus();
}

function DeleteConfirmation({ copy, onDelete, onKeep }: DeleteConfirmationProps) {
  return (
    <div className="reset-view">
      <p className="reset-copy">{copy.t('fixedCosts.deleteDescription')}</p>
      <div className="form-actions">
        <button className="button button-quiet" onClick={onKeep} ref={focusOnMount} type="button">
          {copy.t('fixedCosts.keep')}
        </button>
        <button className="button button-danger" onClick={onDelete} type="button">
          {copy.t('fixedCosts.delete')}
        </button>
      </div>
    </div>
  );
}

function dialogTitle(cost: FixedCost | null, confirmDelete: boolean, copy: Translator): string {
  if (cost === null) return copy.t('fixedCosts.addTitle');
  return confirmDelete
    ? copy.t('fixedCosts.deleteTitle', { name: cost.name })
    : copy.t('fixedCosts.editTitle');
}

interface FixedCostDialogProps {
  copy: Translator;
  /** The cost to edit, or null to add a new one. */
  cost: FixedCost | null;
  currency: CurrencyCode;
  now: Date;
  onClose: () => void;
  onDelete: (cost: FixedCost) => void;
  onSave: (cost: FixedCost) => void;
}

export function FixedCostDialog({
  copy,
  cost,
  currency,
  now,
  onClose,
  onDelete,
  onSave,
}: FixedCostDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Escape steps back from the delete question before it closes the dialog.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (confirmDelete) setConfirmDelete(false);
    else onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') handleCancel(event);
  }

  return (
    <dialog
      aria-labelledby="fixed-cost-title"
      className="sheet-dialog"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      ref={openAsModal}
    >
      <div className="dialog-inner">
        <div className="dialog-header">
          <h2 id="fixed-cost-title">{dialogTitle(cost, confirmDelete, copy)}</h2>
          <button
            aria-label={copy.t('fixedCosts.close')}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
        {confirmDelete && cost !== null && (
          <DeleteConfirmation
            copy={copy}
            onDelete={() => onDelete(cost)}
            onKeep={() => setConfirmDelete(false)}
          />
        )}
        <FixedCostForm
          copy={copy}
          cost={cost}
          currency={currency}
          hidden={confirmDelete}
          now={now}
          onCancel={onClose}
          onDeleteRequest={() => setConfirmDelete(true)}
          onSave={onSave}
        />
      </div>
    </dialog>
  );
}
