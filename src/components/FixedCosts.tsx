import { useRef } from 'react';
import { House } from 'lucide-react';

import { formatWorkDuration } from '../domain/duration';
import {
  isPaidOff,
  MAX_FIXED_COSTS,
  monthlyCostFigures,
  sortFixedCosts,
  summarizeFixedCosts,
  type FixedCost,
} from '../domain/fixedCosts';
import { createTranslator, type Translator } from '../domain/i18n';
import { monthStart, parseMonth } from '../domain/months';
import { formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';
import { FixedCostDialog } from './FixedCostDialog';
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

/** Costs start and end by the month, so the page checks the date once a minute. */
const CLOCK_MS = 60_000;

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
  onEdit: (cost: FixedCost, opener: HTMLElement) => void;
  settings: AffordiSettings;
}

function FixedCostRow({ copy, cost, hidden, now, onEdit, settings }: FixedCostRowProps) {
  const { details, share } = rowFigures(cost, settings, now, copy);
  const month = lastPaymentMonth(cost, copy);
  return (
    <ItemRow
      amount={<Money copy={copy} hidden={hidden} settings={settings} value={cost.amount} />}
      copy={copy}
      details={details}
      editLabel={copy.t('fixedCosts.edit', { name: cost.name })}
      muted={isPaidOff(cost, now)}
      name={cost.name}
      note={month === null ? null : copy.t('fixedCosts.lastPayment', { month })}
      onEdit={(opener) => onEdit(cost, opener)}
      share={share}
    />
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
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialog = useEditDialog<FixedCost>(addButtonRef);
  const now = useNow(CLOCK_MS);
  const copy = createTranslator(settings.language);
  const hidden = settings.hideAmounts;
  const summary = summarizeFixedCosts(fixedCosts, settings, now);
  if (summary === null) return null;

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
    <section aria-labelledby="fixed-costs-title" className="fixed-costs">
      <div className="page-heading">
        <h1 id="fixed-costs-title">{copy.t('fixedCosts.title')}</h1>
        <HideAmountsButton copy={copy} hidden={hidden} onChange={onHideAmountsChange} />
      </div>

      {fixedCosts.length === 0 ? (
        <EmptyList
          addLabel={copy.t('fixedCosts.add')}
          icon={House}
          onAdd={(opener) => dialog.open(null, opener)}
          text={copy.t('fixedCosts.empty')}
        />
      ) : (
        <>
          <div className="card-stack">
            <CostCard
              className="fixed-costs-total"
              copy={copy}
              hidden={hidden}
              label={copy.t('fixedCosts.total')}
              percentage={summary.percentage}
              settings={settings}
              value={summary.total}
              workHours={summary.workHours}
            />
            <PayLeftCard
              className="fixed-costs-left"
              copy={copy}
              hidden={hidden}
              label="fixedCosts.left"
              payLeft={summary}
              settings={settings}
              shortNote="fixedCosts.shortNote"
            />
          </div>
          <ItemList
            addButtonRef={addButtonRef}
            addLabel={copy.t('fixedCosts.add')}
            addShortLabel={copy.t('fixedCosts.addShort')}
            id="fixed-cost-list-title"
            limitNote={
              fixedCosts.length >= MAX_FIXED_COSTS
                ? copy.t('fixedCosts.limit', { count: MAX_FIXED_COSTS })
                : null
            }
            onAdd={(opener) => dialog.open(null, opener)}
            title={copy.t('fixedCosts.list')}
          >
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
          </ItemList>
        </>
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
