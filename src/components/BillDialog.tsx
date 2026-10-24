import { useState, type FormEvent } from 'react';

import { withBillAmount, type Bill } from '../domain/bills';
import type { Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { createItemId, isItemName } from '../domain/items';
import type { CurrencyCode } from '../domain/locale';
import { monthStart, parseMonth } from '../domain/months';
import {
  AmountField,
  DeleteConfirmation,
  FormActions,
  NameField,
  SheetDialog,
} from './SheetDialog';

interface FormValues {
  name: string;
  amount: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

/** The amount a new bill starts with, or null without one, or undefined when it is not valid. */
function readAmount(value: string, locale: string): number | null | undefined {
  if (value.trim() === '') return null;
  const amount = parseDecimalInput(value, locale);
  return amount !== null && amount > 0 ? amount : undefined;
}

/** Checks the form and builds the bill. Its amounts are entered month by month on the page. */
function validate(
  values: FormValues,
  bill: Bill | null,
  month: string,
  copy: Translator,
): { bill?: Bill; errors: FormErrors } {
  const name = values.name.trim();
  const amount = readAmount(values.amount, copy.locale);
  const errors: FormErrors = {};
  if (!isItemName(name)) errors.name = copy.t('validation.costName');
  if (amount === undefined) errors.amount = copy.t('validation.costAmount');
  if (amount === undefined || errors.name !== undefined) return { errors };

  if (bill !== null) return { errors, bill: { ...bill, name } };
  const added: Bill = { id: createItemId(), name, entries: [] };
  return { errors, bill: amount === null ? added : withBillAmount(added, month, amount) };
}

interface BillFormProps {
  bill: Bill | null;
  copy: Translator;
  currency: CurrencyCode;
  hidden: boolean;
  month: string;
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
  month,
  onCancel,
  onDeleteRequest,
  onSave,
}: BillFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({ name: bill?.name ?? '', amount: '' }));
  const [errors, setErrors] = useState<FormErrors>({});
  const shownMonth = parseMonth(month);

  function update(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(values, bill, month, copy);
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
      {bill === null && shownMonth !== null && (
        <AmountField
          copy={copy}
          currency={currency}
          error={errors.amount}
          label={copy.t('bills.amountFor', { month: copy.month(monthStart(shownMonth), true) })}
          onChange={(value) => update('amount', value)}
          placeholder="85"
          value={values.amount}
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
  /** The bill to rename or delete, or null to add a new one. */
  bill: Bill | null;
  copy: Translator;
  currency: CurrencyCode;
  /** The month shown on the page, as YYYY-MM, which a new bill's amount is for. */
  month: string;
  onClose: () => void;
  onDelete: (bill: Bill) => void;
  onSave: (bill: Bill) => void;
}

export function BillDialog({
  bill,
  copy,
  currency,
  month,
  onClose,
  onDelete,
  onSave,
}: BillDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  let title = copy.t('bills.addTitle');
  if (bill !== null) {
    title = confirmDelete
      ? copy.t('fixedCosts.deleteTitle', { name: bill.name })
      : copy.t('bills.editTitle');
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
        month={month}
        onCancel={onClose}
        onDeleteRequest={() => setConfirmDelete(true)}
        onSave={onSave}
      />
    </SheetDialog>
  );
}
