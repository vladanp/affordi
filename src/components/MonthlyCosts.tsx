import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ChevronRight, Plus, type LucideIcon } from 'lucide-react';

import { formatWorkDuration } from '../domain/duration';
import { formatRate } from '../domain/earningsText';
import type { PayLeft } from '../domain/fixedCosts';
import type { TranslationKey, Translator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { HiddenAmount } from './HiddenAmount';

/** Parts shared by the pages of monthly costs: fixed costs and bills. */

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
  className: string;
  copy: Translator;
  hidden: boolean;
  label: TranslationKey;
  payLeft: PayLeft;
  settings: AffordiSettings;
  shortNote: TranslationKey;
}

/** What is left of monthly pay and per workday, or the shortfall when nothing is. */
export function PayLeftCard({
  className,
  copy,
  hidden,
  label,
  payLeft,
  settings,
  shortNote,
}: PayLeftCardProps) {
  const short = payLeft.left < 0;
  let note: string | null = short ? copy.t(shortNote) : null;
  if (!short && !hidden) {
    note = copy.t('fixedCosts.perWorkday', {
      amount: formatRate(payLeft.leftPerWorkday, settings.currency, copy.locale),
    });
  }

  return (
    <div className={`stat-card pay-left ${className}`} data-short={short || undefined}>
      <p className="stat-label">{copy.t(short ? 'fixedCosts.short' : label)}</p>
      <p className="stat-amount">
        <Money copy={copy} hidden={hidden} settings={settings} value={Math.abs(payLeft.left)} />
      </p>
      {note !== null && <p className="stat-note">{note}</p>}
    </div>
  );
}

interface EmptyListProps {
  addLabel: string;
  icon: LucideIcon;
  onAdd: (opener: HTMLElement) => void;
  text: string;
}

export function EmptyList({ addLabel, icon: Icon, onAdd, text }: EmptyListProps) {
  return (
    <div className="empty-list">
      <Icon aria-hidden="true" size={24} strokeWidth={1.75} />
      <p>{text}</p>
      <button
        className="button button-primary"
        onClick={(event) => onAdd(event.currentTarget)}
        type="button"
      >
        <Plus aria-hidden="true" size={18} strokeWidth={2.25} />
        {addLabel}
      </button>
    </div>
  );
}

interface ItemListProps {
  addButtonRef: RefObject<HTMLButtonElement | null>;
  addLabel: string;
  addShortLabel: string;
  children: ReactNode;
  id: string;
  /** Shown instead of the add button working once the list is full. */
  limitNote: string | null;
  onAdd: (opener: HTMLElement) => void;
  title: string;
}

/** A titled list with an add button above it. */
export function ItemList({
  addButtonRef,
  addLabel,
  addShortLabel,
  children,
  id,
  limitNote,
  onAdd,
  title,
}: ItemListProps) {
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
      <ul aria-labelledby={id} className="item-list">
        {children}
      </ul>
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
  muted: boolean;
  name: string;
  /** A last line, such as the last payment. */
  note: string | null;
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
  muted,
  name,
  note,
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
      {note !== null && <span className="item-details item-note">{note}</span>}
    </li>
  );
}
