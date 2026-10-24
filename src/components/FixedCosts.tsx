import { useEffect, useRef, useState, type RefObject } from 'react';
import { ChevronRight, Plus, ReceiptText } from 'lucide-react';

import { formatWorkDuration } from '../domain/duration';
import { formatRate } from '../domain/earningsText';
import {
  isPaidOff,
  MAX_FIXED_COSTS,
  monthlyCostFigures,
  monthStart,
  parseMonth,
  sortFixedCosts,
  summarizeFixedCosts,
  type FixedCost,
  type FixedCostsSummary,
} from '../domain/fixedCosts';
import { createTranslator, type Translator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { FixedCostDialog } from './FixedCostDialog';
import { HiddenAmount, HideAmountsButton } from './HiddenAmount';
import { useNow } from './useNow';

/** Costs start and end by the month, so the page checks the date once a minute. */
const CLOCK_MS = 60_000;

type OpenDialog = (cost: FixedCost | null, opener: HTMLElement) => void;

interface MoneyProps {
  copy: Translator;
  hidden: boolean;
  settings: AffordiSettings;
  value: number;
}

function Money({ copy, hidden, settings, value }: MoneyProps) {
  if (hidden) return <HiddenAmount copy={copy} />;
  return formatCurrency(value, settings.currency, copy.locale);
}

/** The last payment as a month and year, such as "March 2049". */
function lastPaymentMonth(cost: FixedCost, copy: Translator): string | null {
  const last = cost.lastPayment === null ? null : parseMonth(cost.lastPayment);
  return last === null ? null : copy.month(monthStart(last), true);
}

/** What a row says under its name: its work time and share of pay, or that it ended. */
function rowFigures(cost: FixedCost, settings: AffordiSettings, now: Date, copy: Translator) {
  if (isPaidOff(cost, now)) return { details: copy.t('fixedCosts.ended'), share: null };
  const figures = monthlyCostFigures(cost.amount, settings);
  if (figures === null) return { details: '', share: null };
  const duration = formatWorkDuration(figures.workHours, settings, settings.language);
  return {
    details: duration === null ? '' : copy.ofWork(duration),
    share: formatIncomePercentage(figures.percentage, copy.locale),
  };
}

interface FixedCostRowProps {
  copy: Translator;
  cost: FixedCost;
  hidden: boolean;
  now: Date;
  onEdit: OpenDialog;
  settings: AffordiSettings;
}

/** One cost with its work time and share of pay. The whole row opens it for editing. */
function FixedCostRow({ copy, cost, hidden, now, onEdit, settings }: FixedCostRowProps) {
  const { details, share } = rowFigures(cost, settings, now, copy);
  const month = lastPaymentMonth(cost, copy);

  return (
    <li className="fixed-cost" data-ended={isPaidOff(cost, now) || undefined}>
      <button
        aria-label={copy.t('fixedCosts.edit', { name: cost.name })}
        className="fixed-cost-edit"
        onClick={(event) => onEdit(cost, event.currentTarget)}
        type="button"
      >
        {cost.name}
      </button>
      <span className="fixed-cost-amount">
        <Money copy={copy} hidden={hidden} settings={settings} value={cost.amount} />
      </span>
      <ChevronRight aria-hidden="true" className="fixed-cost-chevron" size={18} strokeWidth={2} />
      <span className="fixed-cost-details">{details}</span>
      {share !== null && (
        <span className="fixed-cost-share">
          <span aria-hidden="true">{copy.t('fixedCosts.share', { percentage: share })}</span>
          <span className="visually-hidden">
            {copy.t('fixedCosts.ofPay', { percentage: share })}
          </span>
        </span>
      )}
      {month !== null && (
        <span className="fixed-cost-details fixed-cost-last">
          {copy.t('fixedCosts.lastPayment', { month })}
        </span>
      )}
    </li>
  );
}

/** Under what is left: the amount per workday, or why nothing is left. */
function leftNote(
  summary: FixedCostsSummary,
  hidden: boolean,
  settings: AffordiSettings,
  copy: Translator,
): string | null {
  if (summary.left < 0) return copy.t('fixedCosts.shortNote');
  if (hidden) return null;
  return copy.t('fixedCosts.perWorkday', {
    amount: formatRate(summary.leftPerWorkday, settings.currency, copy.locale),
  });
}

interface SummaryCardsProps {
  copy: Translator;
  hidden: boolean;
  settings: AffordiSettings;
  summary: FixedCostsSummary;
}

/** The month's fixed costs in money, work time, and share of pay, then what is left. */
function SummaryCards({ copy, hidden, settings, summary }: SummaryCardsProps) {
  const short = summary.left < 0;
  const workTime = formatWorkDuration(summary.workHours, settings, settings.language) ?? '';
  const note = leftNote(summary, hidden, settings, copy);

  return (
    <div className="card-stack">
      <div className="stat-card stat-card-highlight fixed-costs-total">
        <p className="stat-label">{copy.t('fixedCosts.total')}</p>
        <p className="stat-amount">
          <Money copy={copy} hidden={hidden} settings={settings} value={summary.total} />
        </p>
        <p className="fixed-costs-work">{copy.ofWork(workTime)}</p>
        <span aria-hidden="true" className="meter">
          <span style={{ inlineSize: `${Math.min(summary.percentage, 100)}%` }} />
        </span>
        <p className="stat-note">
          {copy.t('calculator.payContext', {
            percentage: formatIncomePercentage(summary.percentage, copy.locale),
            period: copy.payPeriod('monthly'),
          })}
        </p>
      </div>
      <div className="stat-card fixed-costs-left" data-short={short || undefined}>
        <p className="stat-label">{copy.t(short ? 'fixedCosts.short' : 'fixedCosts.left')}</p>
        <p className="stat-amount">
          <Money copy={copy} hidden={hidden} settings={settings} value={Math.abs(summary.left)} />
        </p>
        {note !== null && <p className="stat-note">{note}</p>}
      </div>
    </div>
  );
}

function EmptyFixedCosts({ copy, onAdd }: { copy: Translator; onAdd: OpenDialog }) {
  return (
    <div className="fixed-costs-empty">
      <ReceiptText aria-hidden="true" size={24} strokeWidth={1.75} />
      <p>{copy.t('fixedCosts.empty')}</p>
      <button
        className="button button-primary"
        onClick={(event) => onAdd(null, event.currentTarget)}
        type="button"
      >
        <Plus aria-hidden="true" size={18} strokeWidth={2.25} />
        {copy.t('fixedCosts.add')}
      </button>
    </div>
  );
}

interface FixedCostListProps {
  addButtonRef: RefObject<HTMLButtonElement | null>;
  copy: Translator;
  fixedCosts: readonly FixedCost[];
  hidden: boolean;
  now: Date;
  onOpen: OpenDialog;
  settings: AffordiSettings;
}

function FixedCostList({
  addButtonRef,
  copy,
  fixedCosts,
  hidden,
  now,
  onOpen,
  settings,
}: FixedCostListProps) {
  const atLimit = fixedCosts.length >= MAX_FIXED_COSTS;
  return (
    <>
      <div className="fixed-costs-list-heading">
        <h2 id="fixed-cost-list-title">{copy.t('fixedCosts.list')}</h2>
        <button
          aria-label={copy.t('fixedCosts.add')}
          className="pill-button"
          disabled={atLimit}
          onClick={(event) => onOpen(null, event.currentTarget)}
          ref={addButtonRef}
          type="button"
        >
          <Plus aria-hidden="true" size={18} strokeWidth={2.25} />
          {copy.t('fixedCosts.addShort')}
        </button>
      </div>
      <ul aria-labelledby="fixed-cost-list-title" className="fixed-cost-list">
        {sortFixedCosts(fixedCosts, now).map((cost) => (
          <FixedCostRow
            copy={copy}
            cost={cost}
            hidden={hidden}
            key={cost.id}
            now={now}
            onEdit={onOpen}
            settings={settings}
          />
        ))}
      </ul>
      {atLimit && (
        <p className="stat-note fixed-costs-limit">
          {copy.t('fixedCosts.limit', { count: MAX_FIXED_COSTS })}
        </p>
      )}
    </>
  );
}

interface FixedCostsProps {
  fixedCosts: readonly FixedCost[];
  onFixedCostsChange: (fixedCosts: FixedCost[]) => void;
  onHideAmountsChange: (hideAmounts: boolean) => void;
  settings: AffordiSettings;
}

export function FixedCosts({
  fixedCosts,
  onFixedCostsChange,
  onHideAmountsChange,
  settings,
}: FixedCostsProps) {
  // Undefined while closed, null while adding a new cost.
  const [editing, setEditing] = useState<FixedCost | null | undefined>(undefined);
  const openerRef = useRef<HTMLElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);
  const now = useNow(CLOCK_MS);
  const copy = createTranslator(settings.language);
  const hidden = settings.hideAmounts;
  const summary = summarizeFixedCosts(fixedCosts, settings, now);

  // Focus returns to what opened the dialog, or to the add button once that is gone.
  useEffect(() => {
    if (editing !== undefined || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const opener = openerRef.current;
    (opener?.isConnected === true ? opener : addButtonRef.current)?.focus();
  }, [editing]);

  if (summary === null) return null;

  function openDialog(cost: FixedCost | null, opener: HTMLElement) {
    openerRef.current = opener;
    setEditing(cost);
  }

  function closeDialog() {
    restoreFocusRef.current = true;
    setEditing(undefined);
  }

  function save(cost: FixedCost) {
    const exists = fixedCosts.some((saved) => saved.id === cost.id);
    onFixedCostsChange(
      exists
        ? fixedCosts.map((saved) => (saved.id === cost.id ? cost : saved))
        : [...fixedCosts, cost],
    );
    closeDialog();
  }

  function remove(cost: FixedCost) {
    onFixedCostsChange(fixedCosts.filter((saved) => saved.id !== cost.id));
    closeDialog();
  }

  return (
    <section aria-labelledby="fixed-costs-title" className="fixed-costs">
      <div className="page-heading">
        <h1 id="fixed-costs-title">{copy.t('fixedCosts.title')}</h1>
        <HideAmountsButton copy={copy} hidden={hidden} onChange={onHideAmountsChange} />
      </div>

      {fixedCosts.length === 0 ? (
        <EmptyFixedCosts copy={copy} onAdd={openDialog} />
      ) : (
        <>
          <SummaryCards copy={copy} hidden={hidden} settings={settings} summary={summary} />
          <FixedCostList
            addButtonRef={addButtonRef}
            copy={copy}
            fixedCosts={fixedCosts}
            hidden={hidden}
            now={now}
            onOpen={openDialog}
            settings={settings}
          />
        </>
      )}

      {editing !== undefined && (
        <FixedCostDialog
          copy={copy}
          cost={editing}
          currency={settings.currency}
          now={now}
          onClose={closeDialog}
          onDelete={remove}
          onSave={save}
        />
      )}
    </section>
  );
}
