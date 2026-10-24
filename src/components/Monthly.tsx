import type { Bill } from '../domain/bills';
import type { FixedCost } from '../domain/fixedCosts';
import { createTranslator } from '../domain/i18n';
import { formatCurrency } from '../domain/locale';
import { summarizeMonth } from '../domain/monthly';
import type { AffordiSettings } from '../domain/storage';
import { BillsSection } from './BillsSection';
import { FixedCostsSection } from './FixedCostsSection';
import { HideAmountsButton } from './HiddenAmount';
import { CostCard, PayLeftCard } from './MonthlyCosts';
import { useNow } from './useNow';

/** Costs start, end, and change by the month, so the page checks the date once a minute. */
const CLOCK_MS = 60_000;

interface MonthlyProps {
  bills: readonly Bill[];
  fixedCosts: readonly FixedCost[];
  onBillsChange: (bills: Bill[]) => void;
  onFixedCostsChange: (fixedCosts: FixedCost[]) => void;
  onHideAmountsChange: (hideAmounts: boolean) => void;
  settings: AffordiSettings;
}

/**
 * Everything paid each month: one total and what is left of the pay, then the bills that
 * change from month to month and the costs that stay the same.
 */
export function Monthly({
  bills,
  fixedCosts,
  onBillsChange,
  onFixedCostsChange,
  onHideAmountsChange,
  settings,
}: MonthlyProps) {
  const now = useNow(CLOCK_MS);
  const copy = createTranslator(settings.language);
  const hidden = settings.hideAmounts;
  const summary = summarizeMonth(fixedCosts, bills, settings, now);
  if (summary === null) return null;

  const money = (value: number) => formatCurrency(value, settings.currency, copy.locale);
  const breakdown =
    fixedCosts.length > 0 && bills.length > 0
      ? copy.t('monthly.breakdown', { fixed: money(summary.fixed), bills: money(summary.bills) })
      : null;

  return (
    <section aria-labelledby="monthly-title" className="monthly">
      <div className="page-heading">
        <h1 id="monthly-title">{copy.t('monthly.title')}</h1>
        <HideAmountsButton copy={copy} hidden={hidden} onChange={onHideAmountsChange} />
      </div>

      {(fixedCosts.length > 0 || bills.length > 0) && (
        <div className="card-stack">
          <CostCard
            className="monthly-total"
            copy={copy}
            hidden={hidden}
            label={copy.t('monthly.total')}
            note={breakdown}
            percentage={summary.percentage}
            settings={settings}
            value={summary.total}
            workHours={summary.workHours}
          />
          <PayLeftCard copy={copy} hidden={hidden} payLeft={summary} settings={settings} />
        </div>
      )}

      <BillsSection
        bills={bills}
        copy={copy}
        hidden={hidden}
        now={now}
        onBillsChange={onBillsChange}
        settings={settings}
      />
      <FixedCostsSection
        copy={copy}
        fixedCosts={fixedCosts}
        hidden={hidden}
        now={now}
        onFixedCostsChange={onFixedCostsChange}
        settings={settings}
      />
    </section>
  );
}
