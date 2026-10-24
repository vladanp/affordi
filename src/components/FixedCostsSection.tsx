import { useRef } from 'react';

import { formatWorkDuration } from '../domain/duration';
import { formatProgress } from '../domain/earningsText';
import {
  isPaidOff,
  MAX_FIXED_COSTS,
  monthlyCostFigures,
  paidShare,
  paymentProgress,
  sortFixedCosts,
  summarizeLoans,
  type FixedCost,
  type LoansSummary,
  type PaymentProgress,
} from '../domain/fixedCosts';
import type { Translator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { monthStart, parseMonth } from '../domain/months';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { FixedCostDialog } from './FixedCostDialog';
import { ItemRow, ListHeading, Money, useEditDialog } from './MonthlyCosts';

/** The last payment as a line, such as "Last payment: March 2049". */
function lastPaymentNote(lastPayment: string | null, copy: Translator): string | null {
  const last = lastPayment === null ? null : parseMonth(lastPayment);
  if (last === null) return null;
  return copy.t('fixedCosts.lastPayment', { month: copy.month(monthStart(last), true) });
}

/**
 * What is paid and left, such as "€31,350.00 paid · €256,500.00 left", or only the paid
 * share while amounts are hidden.
 */
function progressNote(
  progress: PaymentProgress,
  hidden: boolean,
  settings: AffordiSettings,
  copy: Translator,
): string | null {
  if (hidden) {
    const share = paidShare(progress);
    if (share === null) return null;
    return copy.t('fixedCosts.paidShare', { percentage: formatProgress(share, copy.locale) });
  }

  const money = (value: number) => formatCurrency(value, settings.currency, copy.locale);
  const { paid, left } = progress;
  if (left !== null && left > 0) {
    return paid === null
      ? copy.t('fixedCosts.leftToPay', { amount: money(left) })
      : copy.t('fixedCosts.paidAndLeft', { paid: money(paid), left: money(left) });
  }
  if (paid === null || paid <= 0) return null;
  const key = left === null ? 'fixedCosts.paidSoFar' : 'fixedCosts.paidInTotal';
  return copy.t(key, { amount: money(paid) });
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
  onEdit: (cost: FixedCost, opener: HTMLElement) => void;
  settings: AffordiSettings;
}

function FixedCostRow({ copy, cost, hidden, now, onEdit, settings }: FixedCostRowProps) {
  const { details, share } = rowFigures(cost, settings, now, copy);
  const progress = paymentProgress(cost, now);
  const notes = [
    progressNote(progress, hidden, settings, copy),
    lastPaymentNote(cost.lastPayment, copy),
  ].filter((note) => note !== null);
  return (
    <ItemRow
      amount={<Money copy={copy} hidden={hidden} settings={settings} value={cost.amount} />}
      copy={copy}
      details={details}
      editLabel={copy.t('fixedCosts.edit', { name: cost.name })}
      muted={isPaidOff(cost, now)}
      name={cost.name}
      meter={paidShare(progress)}
      notes={notes}
      onEdit={(opener) => onEdit(cost, opener)}
      share={share}
    />
  );
}

interface LoansCardProps {
  copy: Translator;
  hidden: boolean;
  loans: LoansSummary;
  settings: AffordiSettings;
}

/** What is left to pay on loans, and how much is paid once every first payment is known. */
function LoansCard({ copy, hidden, loans, settings }: LoansCardProps) {
  const share = paidShare(loans);
  let paidNote: string | null = null;
  if (share !== null && hidden) {
    paidNote = copy.t('fixedCosts.paidShare', { percentage: formatProgress(share, copy.locale) });
  } else if (share !== null && loans.paid !== null) {
    paidNote = copy.t('fixedCosts.loansPaid', {
      paid: formatCurrency(loans.paid, settings.currency, copy.locale),
      total: formatCurrency(loans.paid + loans.left, settings.currency, copy.locale),
    });
  }

  return (
    <div className="stat-card fixed-costs-loans">
      <p className="stat-label">{copy.t('fixedCosts.loans')}</p>
      <p className="stat-amount">
        <Money copy={copy} hidden={hidden} settings={settings} value={loans.left} />
      </p>
      {share !== null && (
        <span aria-hidden="true" className="meter">
          <span style={{ inlineSize: `${share * 100}%` }} />
        </span>
      )}
      {paidNote !== null && <p className="stat-note">{paidNote}</p>}
      <p className="stat-note">{lastPaymentNote(loans.lastPayment, copy)}</p>
    </div>
  );
}

interface FixedCostsSectionProps {
  copy: Translator;
  fixedCosts: readonly FixedCost[];
  hidden: boolean;
  now: Date;
  onFixedCostsChange: (fixedCosts: FixedCost[]) => void;
  settings: AffordiSettings;
}

/** Costs that are the same every month, with what is left to pay on loans. */
export function FixedCostsSection({
  copy,
  fixedCosts,
  hidden,
  now,
  onFixedCostsChange,
  settings,
}: FixedCostsSectionProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialog = useEditDialog<FixedCost>(addButtonRef);
  const loans = summarizeLoans(fixedCosts, now);

  function save(cost: FixedCost) {
    const exists = fixedCosts.some((saved) => saved.id === cost.id);
    onFixedCostsChange(
      exists
        ? fixedCosts.map((saved) => (saved.id === cost.id ? cost : saved))
        : [...fixedCosts, cost],
    );
    dialog.close();
  }

  function remove(cost: FixedCost) {
    onFixedCostsChange(fixedCosts.filter((saved) => saved.id !== cost.id));
    dialog.close();
  }

  return (
    <section aria-labelledby="fixed-cost-list-title" className="monthly-section fixed-costs">
      <ListHeading
        addButtonRef={addButtonRef}
        addLabel={copy.t('fixedCosts.add')}
        addShortLabel={copy.t('fixedCosts.addShort')}
        hint={copy.t('fixedCosts.hint')}
        id="fixed-cost-list-title"
        limitNote={
          fixedCosts.length >= MAX_FIXED_COSTS
            ? copy.t('fixedCosts.limit', { count: MAX_FIXED_COSTS })
            : null
        }
        onAdd={(opener) => dialog.open(null, opener)}
        title={copy.t('fixedCosts.list')}
      />
      {loans !== null && (
        <LoansCard copy={copy} hidden={hidden} loans={loans} settings={settings} />
      )}
      {fixedCosts.length > 0 && (
        <ul aria-labelledby="fixed-cost-list-title" className="item-list">
          {sortFixedCosts(fixedCosts, now).map((cost) => (
            <FixedCostRow
              copy={copy}
              cost={cost}
              hidden={hidden}
              key={cost.id}
              now={now}
              onEdit={dialog.open}
              settings={settings}
            />
          ))}
        </ul>
      )}

      {dialog.editing !== undefined && (
        <FixedCostDialog
          copy={copy}
          cost={dialog.editing}
          currency={settings.currency}
          now={now}
          onClose={dialog.close}
          onDelete={remove}
          onSave={save}
        />
      )}
    </section>
  );
}
