import {
  calculateEarnedThisMonth,
  calculateEarnedToday,
  calculateEarningRates,
  rateUnits,
  totalPeriods,
} from '../domain/earnings';
import {
  describeWorkStatus,
  formatEarned,
  formatProgress,
  formatRate,
} from '../domain/earningsText';
import { averageMonthlyBills, type Bill } from '../domain/bills';
import { costsCoverage, monthlyFixedCosts, type FixedCost } from '../domain/fixedCosts';
import { createTranslator, type Translator } from '../domain/i18n';
import type { WorkProgress } from '../domain/schedule';
import type { AffordiSettings } from '../domain/storage';
import { HiddenAmount, HideAmountsButton } from './HiddenAmount';
import { useNow } from './useNow';

/** Totals show the currency's usual decimals, so checking once a second keeps them current. */
const TICK_MS = 1_000;

interface LiveAmountProps {
  /** The total so far, formatted. */
  amount: string;
  copy: Translator;
  hidden: boolean;
}

/** A total for today that moves on as it is earned. */
function LiveAmount({ amount, copy, hidden }: LiveAmountProps) {
  return (
    <p className="stat-amount live-amount">{hidden ? <HiddenAmount copy={copy} /> : amount}</p>
  );
}

interface ProgressCardProps {
  /** Formatted amounts so far and in all, shown only while amounts are visible. */
  amount: string;
  className: string;
  copy: Translator;
  hidden: boolean;
  label: string;
  /** Progress from 0 to 1. */
  share: number;
  /** The share as a sentence for screen readers, given the formatted percentage. */
  spokenShare: (percentage: string) => string;
  /** The amount to reach, left out once it is reached. */
  total: string | null;
}

/** Progress toward a monthly amount. The share stays visible when amounts hide. */
function ProgressCard({
  amount,
  className,
  copy,
  hidden,
  label,
  share,
  spokenShare,
  total,
}: ProgressCardProps) {
  const percentage = formatProgress(share, copy.locale);
  return (
    <div className={`stat-card ${className}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-amount live-amount stat-amount-with-total">
        {hidden ? (
          <HiddenAmount copy={copy} />
        ) : (
          <>
            {amount}
            {total !== null && (
              <>
                {' '}
                <span className="stat-total">{copy.t('earnings.monthTotal', { total })}</span>
              </>
            )}
          </>
        )}
      </p>
      <p className="stat-progress">
        <span aria-hidden="true" className="meter">
          <span style={{ inlineSize: `${share * 100}%` }} />
        </span>
        <span className="stat-share">
          <span aria-hidden="true">{percentage}</span>
          <span className="visually-hidden">{spokenShare(percentage)}</span>
        </span>
      </p>
    </div>
  );
}

/** The work status, with the time left set on its own line in narrow cards. */
function WorkStatus({ copy, progress }: { copy: Translator; progress: WorkProgress }) {
  const [status, timeLeft] = describeWorkStatus(progress, copy);
  return (
    <p className="stat-note earnings-status">
      {status}
      {timeLeft !== undefined && (
        <>
          {' '}
          <span aria-hidden="true" className="status-separator">
            ·
          </span>{' '}
          <span className="status-time-left">{timeLeft}</span>
        </>
      )}
    </p>
  );
}

interface EarningsProps {
  bills: readonly Bill[];
  fixedCosts: readonly FixedCost[];
  settings: AffordiSettings;
  onHideAmountsChange: (hideAmounts: boolean) => void;
}

export function Earnings({ bills, fixedCosts, settings, onHideAmountsChange }: EarningsProps) {
  const amountsHidden = settings.hideAmounts;
  const now = useNow(TICK_MS);
  const copy = createTranslator(settings.language);
  const rates = calculateEarningRates(settings);
  if (rates === null) return null;

  const { currency, language } = settings;
  const today = calculateEarnedToday(settings, rates, now);
  const month = calculateEarnedThisMonth(settings, rates, now);
  // Bills count at their average month, beside the fixed costs still paid this month.
  const billsAverage = averageMonthlyBills(bills, now);
  const coverage = costsCoverage(month.amount, monthlyFixedCosts(fixedCosts, now) + billsAverage);
  const withBills = billsAverage > 0;
  const rate = (value: number) =>
    amountsHidden ? <HiddenAmount copy={copy} /> : formatRate(value, currency, language);

  return (
    <section aria-labelledby="earnings-title" className="earnings">
      <div className="page-heading">
        <h1 id="earnings-title">{copy.t('earnings.title')}</h1>
        <HideAmountsButton copy={copy} hidden={amountsHidden} onChange={onHideAmountsChange} />
      </div>

      <div className="card-stack">
        <div className="stat-card stat-card-highlight earnings-today">
          <p className="stat-label">{copy.t('earnings.today')}</p>
          <LiveAmount
            amount={formatEarned(today.aroundTheClock, currency, language)}
            copy={copy}
            hidden={amountsHidden}
          />
        </div>
        <div className="stat-card earnings-work" data-state={today.progress.state}>
          <p className="stat-label">{copy.t('earnings.atWork')}</p>
          <LiveAmount
            amount={formatEarned(today.atWork, currency, language)}
            copy={copy}
            hidden={amountsHidden}
          />
          <WorkStatus copy={copy} progress={today.progress} />
        </div>
        <ProgressCard
          amount={formatEarned(month.amount, currency, language)}
          className="earnings-month"
          copy={copy}
          hidden={amountsHidden}
          label={copy.t('earnings.month')}
          share={month.share}
          spokenShare={(percentage) => copy.t('earnings.monthShare', { percentage })}
          total={formatRate(rates.totals.month, currency, language)}
        />
        {coverage !== null && (
          <ProgressCard
            amount={formatEarned(coverage.covered, currency, language)}
            className="earnings-fixed-costs"
            copy={copy}
            hidden={amountsHidden}
            label={copy.t(withBills ? 'earnings.costsWithBills' : 'earnings.fixedCosts')}
            share={coverage.share}
            spokenShare={(percentage) =>
              copy.t(withBills ? 'earnings.costsWithBillsShare' : 'earnings.fixedCostsShare', {
                percentage,
              })
            }
            total={coverage.share >= 1 ? null : formatRate(coverage.total, currency, language)}
          />
        )}
      </div>

      <h2 className="breakdown-title" id="breakdown-title">
        {copy.t('earnings.breakdown')}
      </h2>
      <table aria-labelledby="breakdown-title" className="breakdown">
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">{copy.t('earnings.period')}</span>
            </th>
            <th scope="col">{copy.t('earnings.aroundTheClock')}</th>
            <th scope="col">{copy.t('earnings.whileWorking')}</th>
          </tr>
        </thead>
        <tbody>
          {rateUnits.map((unit) => (
            <tr key={unit}>
              <th scope="row">{copy.t(`earnings.per.${unit}`)}</th>
              <td>{rate(rates.aroundTheClock[unit])}</td>
              <td>{rate(rates.atWork[unit])}</td>
            </tr>
          ))}
        </tbody>
        <tbody className="breakdown-totals">
          {totalPeriods.map((period) => (
            <tr key={period}>
              <th scope="row">{copy.t(`earnings.per.${period}`)}</th>
              <td colSpan={2}>{rate(rates.totals[period])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
