import { useRef } from 'react';
import { Receipt } from 'lucide-react';

import {
  billStats,
  MAX_BILLS,
  sortBills,
  summarizeBills,
  type Bill,
  type BillStats,
} from '../domain/bills';
import { formatWorkDuration } from '../domain/duration';
import { monthlyCostFigures, monthlyFixedCosts, type FixedCost } from '../domain/fixedCosts';
import { createTranslator, type Translator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { monthOf, monthStart, parseMonth } from '../domain/months';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { BillDialog } from './BillDialog';
import { BillsChart } from './BillsChart';
import { HideAmountsButton } from './HiddenAmount';
import {
  CostCard,
  EmptyList,
  ItemList,
  ItemRow,
  Money,
  PayLeftCard,
  useEditDialog,
} from './MonthlyCosts';
import { useNow } from './useNow';

/** Months turn over at midnight, so the page checks the date once a minute. */
const CLOCK_MS = 60_000;
const MONTHS_PER_YEAR = 12;

/** The latest amount and how it compares with the average, such as "October: €91.00 · 8% above average". */
function latestNote(
  stats: BillStats,
  hidden: boolean,
  settings: AffordiSettings,
  now: Date,
  copy: Translator,
): string {
  const latest = stats.latest;
  const month = latest === null ? null : parseMonth(latest.month);
  if (latest === null || month === null) return copy.t('bills.noAmounts');

  const name = copy.month(monthStart(month), month.year !== monthOf(now).year);
  const parts = [
    hidden
      ? name
      : copy.t('bills.readout', {
          month: name,
          amount: formatCurrency(latest.amount, settings.currency, copy.locale),
        }),
  ];
  const change = stats.average === null ? 0 : latest.amount / stats.average - 1;
  const percentage = formatIncomePercentage(Math.abs(change) * 100, copy.locale);
  // A difference that rounds to a whole 0% is no difference worth naming.
  if (Math.round(Math.abs(change) * 100) > 0) {
    const key = change > 0 ? 'bills.above' : 'bills.below';
    parts.push(copy.t(key, { percentage: copy.t('fixedCosts.share', { percentage }) }));
  }
  return parts.join(' · ');
}

interface BillRowProps {
  bill: Bill;
  copy: Translator;
  hidden: boolean;
  now: Date;
  onEdit: (bill: Bill, opener: HTMLElement) => void;
  settings: AffordiSettings;
}

/** One bill with its average month, in money, work time, and share of pay. */
function BillRow({ bill, copy, hidden, now, onEdit, settings }: BillRowProps) {
  const stats = billStats(bill, now);
  const figures = stats.average === null ? null : monthlyCostFigures(stats.average, settings);
  const duration =
    figures === null ? null : formatWorkDuration(figures.workHours, settings, settings.language);

  return (
    <ItemRow
      amount={
        stats.average === null ? (
          '–'
        ) : (
          <Money copy={copy} hidden={hidden} settings={settings} value={stats.average} />
        )
      }
      copy={copy}
      details={duration === null ? copy.t('bills.noRecent') : copy.ofWork(duration)}
      editLabel={copy.t('bills.edit', { name: bill.name })}
      muted={stats.average === null}
      name={bill.name}
      notes={[latestNote(stats, hidden, settings, now, copy)]}
      onEdit={(opener) => onEdit(bill, opener)}
      share={figures === null ? null : formatIncomePercentage(figures.percentage, copy.locale)}
    />
  );
}

interface BillsProps {
  bills: readonly Bill[];
  fixedCosts: readonly FixedCost[];
  onBillsChange: (bills: Bill[]) => void;
  onHideAmountsChange: (hideAmounts: boolean) => void;
  settings: AffordiSettings;
}

export function Bills({
  bills,
  fixedCosts,
  onBillsChange,
  onHideAmountsChange,
  settings,
}: BillsProps) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialog = useEditDialog<Bill>(addButtonRef);
  const now = useNow(CLOCK_MS);
  const copy = createTranslator(settings.language);
  const hidden = settings.hideAmounts;
  const summary = summarizeBills(bills, monthlyFixedCosts(fixedCosts, now), settings, now);
  if (summary === null) return null;

  function save(bill: Bill) {
    const exists = bills.some((saved) => saved.id === bill.id);
    onBillsChange(
      exists ? bills.map((saved) => (saved.id === bill.id ? bill : saved)) : [...bills, bill],
    );
    dialog.close();
  }

  function remove(bill: Bill) {
    onBillsChange(bills.filter((saved) => saved.id !== bill.id));
    dialog.close();
  }

  return (
    <section aria-labelledby="bills-title" className="bills">
      <div className="page-heading">
        <h1 id="bills-title">{copy.t('bills.title')}</h1>
        <HideAmountsButton copy={copy} hidden={hidden} onChange={onHideAmountsChange} />
      </div>

      {bills.length === 0 ? (
        <EmptyList
          addLabel={copy.t('bills.add')}
          icon={Receipt}
          onAdd={(opener) => dialog.open(null, opener)}
          text={copy.t('bills.empty')}
        />
      ) : (
        <>
          <div className="card-stack">
            <CostCard
              className="bills-average"
              copy={copy}
              hidden={hidden}
              label={copy.t('bills.average')}
              note={copy.t('bills.perYear', {
                amount: formatCurrency(
                  summary.average * MONTHS_PER_YEAR,
                  settings.currency,
                  copy.locale,
                ),
              })}
              percentage={summary.percentage}
              settings={settings}
              value={summary.average}
              workHours={summary.workHours}
            />
            <PayLeftCard
              className="bills-left"
              copy={copy}
              hidden={hidden}
              label="bills.left"
              payLeft={summary}
              settings={settings}
              shortNote="bills.shortNote"
            />
            <BillsChart
              copy={copy}
              currency={settings.currency}
              hidden={hidden}
              key={summary.totals.at(-1)?.month}
              summary={summary}
            />
          </div>
          <ItemList
            addButtonRef={addButtonRef}
            addLabel={copy.t('bills.add')}
            addShortLabel={copy.t('bills.addShort')}
            id="bill-list-title"
            limitNote={
              bills.length >= MAX_BILLS ? copy.t('bills.limit', { count: MAX_BILLS }) : null
            }
            onAdd={(opener) => dialog.open(null, opener)}
            title={copy.t('bills.list')}
          >
            {sortBills(bills, now).map((bill) => (
              <BillRow
                bill={bill}
                copy={copy}
                hidden={hidden}
                key={bill.id}
                now={now}
                onEdit={dialog.open}
                settings={settings}
              />
            ))}
          </ItemList>
        </>
      )}

      {dialog.editing !== undefined && (
        <BillDialog
          bill={dialog.editing}
          copy={copy}
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
