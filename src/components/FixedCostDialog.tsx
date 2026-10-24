import { useState, type FormEvent } from 'react';

import type { FixedCost } from '../domain/fixedCosts';
import type { Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { createItemId, isItemName } from '../domain/items';
import type { CurrencyCode } from '../domain/locale';
import { isMonthBefore, monthStart, monthValue, parseMonth } from '../domain/months';
import { FieldError } from './FieldError';
import {
  AmountField,
  DeleteConfirmation,
  FormActions,
  NameField,
  SheetDialog,
} from './SheetDialog';

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

/** A saved amount in the user's locale, without grouping so it reads back the same way. */
function amountInputValue(amount: number, locale: string): string {
  return amount.toLocaleString(locale, { maximumFractionDigits: 6, useGrouping: false });
}

function initialValues(cost: FixedCost | null, locale: string): FormValues {
  if (cost === null) return { name: '', amount: '', month: '', year: '' };
  const last = cost.lastPayment === null ? null : parseMonth(cost.lastPayment);
  return {
    name: cost.name,
    amount: amountInputValue(cost.amount, locale),
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
  if (!isItemName(name)) errors.name = copy.t('validation.costName');
  if (amount === null || amount <= 0) errors.amount = copy.t('validation.costAmount');
  if (error !== undefined) errors.lastPayment = error;

  if (amount === null || Object.keys(errors).length > 0) return { errors };
  return { errors, cost: { id: cost?.id ?? createItemId(), name, amount, lastPayment } };
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
    <form className="income-form item-form" hidden={hidden} noValidate onSubmit={handleSubmit}>
      <NameField
        copy={copy}
        error={errors.name}
        onChange={(value) => update('name', value)}
        placeholder={copy.t('fixedCosts.namePlaceholder')}
        value={values.name}
      />
      <AmountField
        copy={copy}
        currency={currency}
        error={errors.amount}
        label={copy.t('fixedCosts.amountLabel')}
        onChange={(value) => update('amount', value)}
        placeholder="950"
        value={values.amount}
      />
      <LastPaymentField
        copy={copy}
        error={errors.lastPayment}
        now={now}
        onChange={update}
        values={values}
      />
      <FormActions
        copy={copy}
        onCancel={onCancel}
        onDeleteRequest={cost === null ? null : onDeleteRequest}
        submitLabel={copy.t(cost === null ? 'fixedCosts.add' : 'fixedCosts.save')}
      />
    </form>
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

  return (
    <SheetDialog
      closeLabel={copy.t('fixedCosts.close')}
      onBack={confirmDelete ? () => setConfirmDelete(false) : null}
      onClose={onClose}
      title={dialogTitle(cost, confirmDelete, copy)}
    >
      {confirmDelete && cost !== null && (
        <DeleteConfirmation
          copy={copy}
          description={copy.t('fixedCosts.deleteDescription')}
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
    </SheetDialog>
  );
}
