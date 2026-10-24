import { useState, type FormEvent } from 'react';

import type { FixedCost } from '../domain/fixedCosts';
import type { Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { createItemId, isItemName } from '../domain/items';
import type { CurrencyCode } from '../domain/locale';
import {
  isMonthBefore,
  monthsAfter,
  monthStart,
  monthValue,
  parseMonth,
  type CalendarMonth,
} from '../domain/months';
import { FieldError } from './FieldError';
import {
  AmountField,
  DeleteConfirmation,
  FormActions,
  NameField,
  SheetDialog,
} from './SheetDialog';

/** Mortgages run for decades, so the year lists reach this far ahead and back. */
const YEARS_AHEAD = 50;
const YEARS_BACK = 50;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

interface FormValues {
  name: string;
  amount: string;
  firstMonth: string;
  firstYear: string;
  lastMonth: string;
  lastYear: string;
}

type FormErrors = Partial<Record<'name' | 'amount' | 'firstPayment' | 'lastPayment', string>>;

/** The error each field clears when it changes. */
const errorOf: Record<keyof FormValues, keyof FormErrors> = {
  name: 'name',
  amount: 'amount',
  firstMonth: 'firstPayment',
  firstYear: 'firstPayment',
  lastMonth: 'lastPayment',
  lastYear: 'lastPayment',
};

/** Controls in the order they appear, so focus lands on the first problem. */
const errorControls = [
  ['name', 'name'],
  ['amount', 'amount'],
  ['firstPayment', 'firstMonth'],
  ['lastPayment', 'lastMonth'],
] as const satisfies readonly (readonly [keyof FormErrors, keyof FormValues])[];

/** A saved amount in the user's locale, without grouping so it reads back the same way. */
function amountInputValue(amount: number, locale: string): string {
  return amount.toLocaleString(locale, { maximumFractionDigits: 6, useGrouping: false });
}

/** A saved month as the values of its month and year lists. */
function monthParts(value: string | null): [month: string, year: string] {
  const month = value === null ? null : parseMonth(value);
  return month === null ? ['', ''] : [String(month.month), String(month.year)];
}

function initialValues(cost: FixedCost | null, locale: string): FormValues {
  const [firstMonth, firstYear] = monthParts(cost?.firstPayment ?? null);
  const [lastMonth, lastYear] = monthParts(cost?.lastPayment ?? null);
  return {
    name: cost?.name ?? '',
    amount: cost === null ? '' : amountInputValue(cost.amount, locale),
    firstMonth,
    firstYear,
    lastMonth,
    lastYear,
  };
}

interface MonthResult {
  month: CalendarMonth | null;
  error?: string;
}

/** Both parts of an optional month, or neither. */
function readMonth(month: string, year: string, copy: Translator): MonthResult {
  if (month === '' && year === '') return { month: null };
  if (month === '' || year === '') return { month: null, error: copy.t('validation.lastPayment') };
  return { month: { year: Number(year), month: Number(month) } };
}

/** The last payment is not in the past, unless it was saved that way. */
function readLastPayment(
  values: FormValues,
  cost: FixedCost | null,
  now: Date,
  copy: Translator,
): MonthResult {
  const result = readMonth(values.lastMonth, values.lastYear, copy);
  const { month } = result;
  if (month !== null && isMonthBefore(month, now) && monthValue(month) !== cost?.lastPayment) {
    return { month, error: copy.t('validation.lastPaymentPast') };
  }
  return result;
}

/** The first payment comes no later than the last one. */
function readFirstPayment(
  values: FormValues,
  last: CalendarMonth | null,
  copy: Translator,
): MonthResult {
  const result = readMonth(values.firstMonth, values.firstYear, copy);
  if (result.month !== null && last !== null && monthsAfter(result.month, last) > 0) {
    return { month: result.month, error: copy.t('validation.firstPaymentAfterLast') };
  }
  return result;
}

function savedMonth({ month }: MonthResult): string | null {
  return month === null ? null : monthValue(month);
}

/** An amount greater than 0, or null. */
function readAmount(value: string, locale: string): number | null {
  const amount = parseDecimalInput(value, locale);
  return amount !== null && amount > 0 ? amount : null;
}

/** The fields that have an error. */
function formErrors(errors: Record<keyof FormErrors, string | undefined>): FormErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error !== undefined));
}

function validate(
  values: FormValues,
  cost: FixedCost | null,
  now: Date,
  copy: Translator,
): { cost?: FixedCost; errors: FormErrors } {
  const name = values.name.trim();
  const amount = readAmount(values.amount, copy.locale);
  const last = readLastPayment(values, cost, now, copy);
  const first = readFirstPayment(values, last.month, copy);
  const errors = formErrors({
    name: isItemName(name) ? undefined : copy.t('validation.costName'),
    amount: amount === null ? copy.t('validation.costAmount') : undefined,
    firstPayment: first.error,
    lastPayment: last.error,
  });

  if (amount === null || Object.keys(errors).length > 0) return { errors };
  const id = cost?.id ?? createItemId();
  return {
    errors,
    cost: { id, name, amount, firstPayment: savedMonth(first), lastPayment: savedMonth(last) },
  };
}

function focusFirstError(form: HTMLFormElement, errors: FormErrors) {
  const first = errorControls.find(([field]) => errors[field] !== undefined);
  const control = first === undefined ? null : form.elements.namedItem(first[1]);
  if (control instanceof HTMLElement) control.focus();
}

/** Years from `from` to `to` in that order, reaching a saved year outside them. */
function yearRange(from: number, to: number, savedYear: string): number[] {
  const saved = Number(savedYear) || from;
  const step = from <= to ? 1 : -1;
  const start = step === 1 ? Math.min(from, saved) : Math.max(from, saved);
  const end = step === 1 ? Math.max(to, saved) : Math.min(to, saved);
  return Array.from({ length: Math.abs(end - start) + 1 }, (_, index) => start + index * step);
}

interface MonthYearFieldProps {
  copy: Translator;
  error: string | undefined;
  hint: string;
  /** Prefixes the ids of the hint and the error. */
  id: string;
  legend: string;
  names: readonly [month: keyof FormValues, year: keyof FormValues];
  now: Date;
  onChange: (name: keyof FormValues, value: string) => void;
  values: FormValues;
  years: readonly number[];
}

/** An optional month and year, chosen from lists because month inputs are missing in some browsers. */
function MonthYearField({
  copy,
  error,
  hint,
  id,
  legend,
  names: [monthName, yearName],
  now,
  onChange,
  values,
  years,
}: MonthYearFieldProps) {
  const describedBy = error === undefined ? `${id}-hint` : `${id}-hint ${id}-error`;
  return (
    <fieldset aria-describedby={describedBy} className="field form-wide">
      <legend className="field-label">{legend}</legend>
      <div className="month-year">
        <span className="select-wrap">
          <select
            aria-invalid={error !== undefined}
            aria-label={copy.t('fixedCosts.month')}
            name={monthName}
            onChange={(event) => onChange(monthName, event.target.value)}
            value={values[monthName]}
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
            name={yearName}
            onChange={(event) => onChange(yearName, event.target.value)}
            value={values[yearName]}
          >
            <option value="">{copy.t('fixedCosts.year')}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="select-chevron" />
        </span>
      </div>
      <small className="field-hint" id={`${id}-hint`}>
        {hint}
      </small>
      <FieldError error={error} id={`${id}-error`} />
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
  const thisYear = now.getFullYear();

  function update(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [errorOf[name]]: undefined }));
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
      <MonthYearField
        copy={copy}
        error={errors.firstPayment}
        hint={copy.t('fixedCosts.firstPaymentHint')}
        id="first-payment"
        legend={copy.t('fixedCosts.firstPaymentLabel')}
        names={['firstMonth', 'firstYear']}
        now={now}
        onChange={update}
        values={values}
        // Recent years first, since most loans started not long ago.
        years={yearRange(thisYear + 1, thisYear - YEARS_BACK, values.firstYear)}
      />
      <MonthYearField
        copy={copy}
        error={errors.lastPayment}
        hint={copy.t('fixedCosts.lastPaymentHint')}
        id="last-payment"
        legend={copy.t('fixedCosts.lastPaymentLabel')}
        names={['lastMonth', 'lastYear']}
        now={now}
        onChange={update}
        values={values}
        years={yearRange(thisYear, thisYear + YEARS_AHEAD, values.lastYear)}
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
