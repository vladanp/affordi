import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';

import { calculateWorkHours, type PriceRepeat } from '../domain/calculations';
import {
  addCheck,
  createCheck,
  loadChecks,
  MAX_NAME_LENGTH,
  recurringYearlyTotal,
  saveChecks,
  type SavedCheck,
} from '../domain/checks';
import { formatPrimaryDuration } from '../domain/duration';
import type { Translator } from '../domain/i18n';
import type { CurrencyCode } from '../domain/locale';
import { timeSettings } from '../domain/priceResult';
import { describePrice, formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';

interface SavedChecksState {
  checks: SavedCheck[];
  persisted: boolean;
  add: (name: string, price: number, repeat: PriceRepeat, currency: CurrencyCode) => void;
  remove: (id: string) => void;
}

/** Saved items live in state and are written to this device after every change. */
export function useSavedChecks(): SavedChecksState {
  const [checks, setChecks] = useState<SavedCheck[]>(loadChecks);
  const [persisted, setPersisted] = useState(true);

  function update(next: SavedCheck[]) {
    setChecks(next);
    setPersisted(saveChecks(next));
  }

  return {
    checks,
    persisted,
    add: (name, price, repeat, currency) =>
      update(addCheck(checks, createCheck(name, price, repeat, currency))),
    remove: (id) => update(checks.filter((check) => check.id !== id)),
  };
}

interface SaveItemFormProps {
  copy: Translator;
  onSave: (name: string) => void;
}

/** Keeps the current price, with an optional name, in the saved list. */
export function SaveItemForm({ copy, onSave }: SaveItemFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(name);
    setName('');
    setStatus(copy.t('saved.added'));
  }

  return (
    <form className="save-item" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="item-name">
        {copy.t('saved.nameLabel')}
      </label>
      <input
        autoComplete="off"
        enterKeyHint="done"
        id="item-name"
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => {
          setName(event.target.value);
          setStatus('');
        }}
        placeholder={copy.t('saved.nameLabel')}
        type="text"
        value={name}
      />
      <button className="button button-quiet save-item-button" type="submit">
        <Bookmark aria-hidden="true" size={18} strokeWidth={2} />
        <span>{copy.t('saved.save')}</span>
      </button>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </form>
  );
}

function itemTime(check: SavedCheck, settings: AffordiSettings, copy: Translator): string {
  if (check.currency !== settings.currency) {
    return copy.t('saved.otherCurrency', { currency: check.currency });
  }
  const time = timeSettings(settings);
  const workHours = calculateWorkHours(check.price, time);
  const duration =
    workHours === null ? null : formatPrimaryDuration(workHours, time, settings.language);
  return duration ?? '';
}

interface SavedItemRowProps {
  check: SavedCheck;
  copy: Translator;
  onRemove: () => void;
  settings: AffordiSettings;
}

function SavedItemRow({ check, copy, onRemove, settings }: SavedItemRowProps) {
  const price = describePrice(check.price, check.repeat, check.currency, copy);
  const time = itemTime(check, settings, copy);
  const title = check.name === '' ? price : check.name;
  return (
    <li className="saved-item">
      <div className="saved-text">
        <p className="saved-name">{title}</p>
        <p className="saved-meta">{check.name === '' ? time : `${price} · ${time}`}</p>
      </div>
      <button
        aria-label={copy.t('saved.remove', { name: title })}
        className="icon-button saved-remove"
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} strokeWidth={1.75} />
      </button>
    </li>
  );
}

function RecurringTotal({
  checks,
  copy,
  settings,
}: {
  checks: readonly SavedCheck[];
  copy: Translator;
  settings: AffordiSettings;
}) {
  const time = timeSettings(settings);
  const total = recurringYearlyTotal(checks, settings, time);
  const duration =
    total === null ? null : formatPrimaryDuration(total.workHours, time, settings.language);
  if (total === null || duration === null) return null;

  return (
    <div className="saved-total">
      <p className="saved-total-label">{copy.t('saved.totalLabel')}</p>
      <p className="saved-total-value">{duration}</p>
      <p className="saved-total-share">
        {copy.t('calculator.payContext', {
          percentage: formatIncomePercentage(total.percentage, settings.language),
          period: copy.payPeriod('yearly'),
        })}
      </p>
    </div>
  );
}

interface SavedItemsProps {
  checks: readonly SavedCheck[];
  copy: Translator;
  /** Receives focus when the last item is removed. */
  fallbackFocusRef: RefObject<HTMLElement | null>;
  onRemove: (id: string) => void;
  persisted: boolean;
  settings: AffordiSettings;
}

/** The saved list with a yearly total for recurring costs. Hidden while it is empty. */
export function SavedItems({
  checks,
  copy,
  fallbackFocusRef,
  onRemove,
  persisted,
  settings,
}: SavedItemsProps) {
  const listRef = useRef<HTMLUListElement>(null);
  if (checks.length === 0) return null;

  // Moves focus to the next or previous item before the removed button leaves the page.
  function remove(index: number, id: string) {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('.saved-remove');
    const next = buttons?.item(index + 1) ?? buttons?.item(index - 1) ?? fallbackFocusRef.current;
    onRemove(id);
    next?.focus();
  }

  return (
    <section aria-labelledby="saved-title" className="saved-items">
      <h2 id="saved-title">{copy.t('saved.title')}</h2>
      {!persisted && (
        <p className="storage-notice" role="status">
          {copy.t('storage.visitOnly')}
        </p>
      )}
      <RecurringTotal checks={checks} copy={copy} settings={settings} />
      <ul className="saved-list" ref={listRef}>
        {checks.map((check, index) => (
          <SavedItemRow
            check={check}
            copy={copy}
            key={check.id}
            onRemove={() => remove(index, check.id)}
            settings={settings}
          />
        ))}
      </ul>
    </section>
  );
}
