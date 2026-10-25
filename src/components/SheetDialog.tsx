import type { KeyboardEvent, ReactNode, SyntheticEvent } from 'react';
import { X } from 'lucide-react';

import type { Translator } from '../domain/i18n';
import { MAX_ITEM_NAME_LENGTH } from '../domain/items';
import { getCurrencySymbol, type CurrencyCode } from '../domain/locale';
import { FieldError } from './FieldError';

/** Parts shared by the dialogs that add and edit fixed costs and bills. */

function openAsModal(node: HTMLDialogElement | null) {
  if (node === null || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}

interface SheetDialogProps {
  children: ReactNode;
  closeLabel: string;
  /** What Escape does first, such as leaving a question, before it closes the dialog. */
  onBack: (() => void) | null;
  onClose: () => void;
  title: string;
}

/** A modal dialog that rises from the bottom on a phone. */
export function SheetDialog({ children, closeLabel, onBack, onClose, title }: SheetDialogProps) {
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (onBack === null) onClose();
    else onBack();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') handleCancel(event);
  }

  return (
    <dialog
      aria-labelledby="sheet-title"
      className="sheet-dialog"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      ref={openAsModal}
    >
      <div className="dialog-inner">
        <div className="dialog-header">
          <h2 id="sheet-title">{title}</h2>
          <button aria-label={closeLabel} className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** Moves focus to the safe choice when the question appears. A stable callback runs only once. */
function focusOnMount(node: HTMLButtonElement | null) {
  node?.focus();
}

interface DeleteConfirmationProps {
  copy: Translator;
  description: string;
  onDelete: () => void;
  onKeep: () => void;
}

export function DeleteConfirmation({
  copy,
  description,
  onDelete,
  onKeep,
}: DeleteConfirmationProps) {
  return (
    <div className="reset-view">
      <p className="reset-copy">{description}</p>
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

interface NameFieldProps {
  copy: Translator;
  error: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export function NameField({ copy, error, onChange, placeholder, value }: NameFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="item-name">
        {copy.t('fixedCosts.nameLabel')}
      </label>
      <input
        aria-describedby={error === undefined ? undefined : 'item-name-error'}
        aria-invalid={error !== undefined}
        autoComplete="off"
        enterKeyHint="next"
        id="item-name"
        maxLength={MAX_ITEM_NAME_LENGTH}
        name="name"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <FieldError error={error} id="item-name-error" />
    </div>
  );
}

interface AmountFieldProps {
  copy: Translator;
  currency: CurrencyCode;
  error: string | undefined;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
  value: string;
}

export function AmountField({
  copy,
  currency,
  error,
  label,
  onChange,
  placeholder,
  value,
}: AmountFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="item-amount">
        {label}
      </label>
      <span className="input-with-prefix">
        <span aria-hidden="true" className="input-prefix">
          {getCurrencySymbol(currency, copy.locale)}
        </span>
        <input
          aria-describedby={
            error === undefined ? 'item-currency' : 'item-currency item-amount-error'
          }
          aria-invalid={error !== undefined}
          autoComplete="off"
          enterKeyHint="next"
          id="item-amount"
          inputMode="decimal"
          name="amount"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          type="text"
          value={value}
        />
      </span>
      <small className="visually-hidden" id="item-currency">
        {copy.t('fixedCosts.amountDescription', { currency })}
      </small>
      <FieldError error={error} id="item-amount-error" />
    </div>
  );
}

interface FormActionsProps {
  copy: Translator;
  onCancel: () => void;
  /** Starts deleting the item being edited, or null while adding one. */
  onDeleteRequest: (() => void) | null;
  submitLabel: string;
}

export function FormActions({ copy, onCancel, onDeleteRequest, submitLabel }: FormActionsProps) {
  return (
    <>
      {onDeleteRequest !== null && (
        <button
          className="text-button danger-button form-wide"
          onClick={onDeleteRequest}
          type="button"
        >
          {copy.t('fixedCosts.delete')}
        </button>
      )}
      <div className="form-actions form-wide">
        <button className="button button-quiet" onClick={onCancel} type="button">
          {copy.t('form.cancel')}
        </button>
        <button className="button button-primary" type="submit">
          {submitLabel}
        </button>
      </div>
    </>
  );
}
