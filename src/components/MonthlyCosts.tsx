import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

import { formatWorkDuration } from '../domain/duration';
import { formatRate } from '../domain/earningsText';
import type { PayLeft } from '../domain/fixedCosts';
import type { Translator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { HiddenAmount } from './HiddenAmount';

/** Parts shared by the sections of the monthly page: fixed costs and bills. */

interface MoneyProps {
  copy: Translator;
  hidden: boolean;
  settings: AffordiSettings;
  value: number;
}

export function Money({ copy, hidden, settings, value }: MoneyProps) {
  if (hidden) return <HiddenAmount copy={copy} />;
  return formatCurrency(value, settings.currency, copy.locale);
}

/**
 * The item a dialog edits, undefined while it is closed and null while adding.
 * Focus returns to what opened the dialog, or to the add button once that is gone.
 */
export function useEditDialog<T>(addButtonRef: RefObject<HTMLButtonElement | null>) {
  const [editing, setEditing] = useState<T | null | undefined>(undefined);
  const openerRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (editing !== undefined || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const opener = openerRef.current;
    (opener?.isConnected === true ? opener : addButtonRef.current)?.focus();
  }, [editing, addButtonRef]);

  function open(item: T | null, opener: HTMLElement) {
    openerRef.current = opener;
    setEditing(item);
  }

  function close() {
    restoreFocusRef.current = true;
    setEditing(undefined);
  }

  return { close, editing, open };
}

interface CostCardProps {
  className: string;
  copy: Translator;
  hidden: boolean;
  label: string;
  note?: string | null;
  percentage: number;
  settings: AffordiSettings;
  value: number;
  workHours: number;
}

/** A monthly amount in money, work time, and share of take home pay. */
export function CostCard({
  className,
  copy,
  hidden,
  label,
  note = null,
  percentage,
  settings,
  value,
  workHours,
}: CostCardProps) {
  const workTime = formatWorkDuration(workHours, settings, settings.language) ?? '';
  return (
    <div className={`stat-card stat-card-highlight ${className}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-amount">
        <Money copy={copy} hidden={hidden} settings={settings} value={value} />
      </p>
      <p className="cost-work-time">{copy.ofWork(workTime)}</p>
      <span aria-hidden="true" className="meter">
        <span style={{ inlineSize: `${Math.min(percentage, 100)}%` }} />
      </span>
      <p className="stat-note">
        {copy.t('calculator.payContext', {
          percentage: formatIncomePercentage(percentage, copy.locale),
          period: copy.payPeriod('monthly'),
        })}
      </p>
      {note !== null && !hidden && <p className="stat-note">{note}</p>}
    </div>
  );
}

interface PayLeftCardProps {
  copy: Translator;
  hidden: boolean;
  payLeft: PayLeft;
  settings: AffordiSettings;
}

/** What is left of monthly pay and per day, or the shortfall when nothing is. */
export function PayLeftCard({ copy, hidden, payLeft, settings }: PayLeftCardProps) {
  const short = payLeft.left < 0;
  let note: string | null = short ? copy.t('monthly.shortNote') : null;
  if (!short && !hidden) {
    note = copy.t('monthly.perDay', {
      amount: formatRate(payLeft.leftPerDay, settings.currency, copy.locale),
    });
  }

  return (
    <div className="stat-card pay-left monthly-left" data-short={short || undefined}>
      <p className="stat-label">{copy.t(short ? 'monthly.short' : 'monthly.left')}</p>
      <p className="stat-amount">
        <Money copy={copy} hidden={hidden} settings={settings} value={Math.abs(payLeft.left)} />
      </p>
      {note !== null && <p className="stat-note">{note}</p>}
    </div>
  );
}

interface ListHeadingProps {
  addButtonRef: RefObject<HTMLButtonElement | null>;
  addLabel: string;
  addShortLabel: string;
  /** What belongs in the section. */
  hint: string;
  id: string;
  /** Shown instead of the add button working once the list is full. */
  limitNote: string | null;
  onAdd: (opener: HTMLElement) => void;
  title: string;
}

/** A section title with what belongs in it and a button that adds to it. */
export function ListHeading({
  addButtonRef,
  addLabel,
  addShortLabel,
  hint,
  id,
  limitNote,
  onAdd,
  title,
}: ListHeadingProps) {
  return (
    <>
      <div className="list-heading">
        <h2 id={id}>{title}</h2>
        <button
          aria-label={addLabel}
          className="pill-button"
          disabled={limitNote !== null}
          onClick={(event) => onAdd(event.currentTarget)}
          ref={addButtonRef}
          type="button"
        >
          <Plus aria-hidden="true" size={18} strokeWidth={2.25} />
          {addShortLabel}
        </button>
      </div>
      <p className="list-hint">{hint}</p>
      {limitNote !== null && <p className="stat-note list-limit">{limitNote}</p>}
    </>
  );
}

interface ItemRowProps {
  amount: ReactNode;
  copy: Translator;
  /** The line under the name, such as the work time. */
  details: string;
  editLabel: string;
  /** A filled part from 0 to 1, such as how much of a loan is paid, or null for none. */
  meter?: number | null;
  muted: boolean;
  name: string;
  /** Last lines, such as what is paid and the last payment. */
  notes: readonly string[];
  onEdit: (opener: HTMLElement) => void;
  /** The formatted percentage of monthly pay, or null to leave it out. */
  share: string | null;
}

/** One item with its amount, details, and share of pay. The whole row opens it for editing. */
export function ItemRow({
  amount,
  copy,
  details,
  editLabel,
  meter = null,
  muted,
  name,
  notes,
  onEdit,
  share,
}: ItemRowProps) {
  return (
    <li className="item" data-muted={muted || undefined}>
      <button
        aria-label={editLabel}
        className="item-edit"
        onClick={(event) => onEdit(event.currentTarget)}
        type="button"
      >
        {name}
      </button>
      <span className="item-amount">{amount}</span>
      <ChevronRight aria-hidden="true" className="item-chevron" size={18} strokeWidth={2} />
      <span className="item-details">{details}</span>
      {share !== null && (
        <span className="item-share">
          <span aria-hidden="true">{copy.t('fixedCosts.share', { percentage: share })}</span>
          <span className="visually-hidden">
            {copy.t('fixedCosts.ofPay', { percentage: share })}
          </span>
        </span>
      )}
      {meter !== null && (
        <span aria-hidden="true" className="meter item-meter">
          <span style={{ inlineSize: `${meter * 100}%` }} />
        </span>
      )}
      {notes.map((note) => (
        <span className="item-details item-note" key={note}>
          {note}
        </span>
      ))}
    </li>
  );
}
