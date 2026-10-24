import { useSyncExternalStore } from 'react';

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
  formatTicker,
  tickerDigits,
  type TickerParts,
} from '../domain/earningsText';
import { fixedCostsCoverage, monthlyFixedCosts, type FixedCost } from '../domain/fixedCosts';
import { createTranslator, type Translator } from '../domain/i18n';
import type { WorkProgress } from '../domain/schedule';
import type { AffordiSettings } from '../domain/storage';
import { HiddenAmount, HideAmountsButton } from './HiddenAmount';
import { useNow } from './useNow';

/** Live totals move several times a second, and once a second for reduced motion or hidden amounts. */
const TICK_MS = 100;
const SLOW_TICK_MS = 1_000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

interface LiveAmountProps {
  copy: Translator;
  hidden: boolean;
  parts: TickerParts;
}

/** A live total for today, with the digits beyond the currency's usual precision set smaller. */
function LiveAmount({ copy, hidden, parts }: LiveAmountProps) {
  return (
    <p className="stat-amount live-amount">
      {hidden ? (
        <HiddenAmount copy={copy} />
      ) : (
        <>
          {parts.lead}
          <span className="live-amount-extra">{parts.extra}</span>
          {parts.trail}
        </>
      )}
    </p>
  );
}

interface ProgressCardProps {
  /** Formatted amounts so far and in all, shown only while amounts are visible. */
  amount: string;
  caption: string;
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

/**
 * Progress toward a monthly amount, in the currency's usual precision since it
 * needs no live digits. The share stays visible when amounts hide.
 */
function ProgressCard({
  amount,
  caption,
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
      <span aria-hidden="true" className="meter">
        <span style={{ inlineSize: `${share * 100}%` }} />
      </span>
      <p className="stat-note stat-caption">
        <span>{caption}</span>{' '}
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
  fixedCosts: readonly FixedCost[];
  settings: AffordiSettings;
  onHideAmountsChange: (hideAmounts: boolean) => void;
}

export function Earnings({ fixedCosts, settings, onHideAmountsChange }: EarningsProps) {
  const amountsHidden = settings.hideAmounts;
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const now = useNow(amountsHidden || reducedMotion ? SLOW_TICK_MS : TICK_MS);
  const copy = createTranslator(settings.language);
  const rates = calculateEarningRates(settings);
  if (rates === null) return null;

  const { currency, language } = settings;
  const today = calculateEarnedToday(settings, rates, now);
  const month = calculateEarnedThisMonth(settings, rates, now);
  const coverage = fixedCostsCoverage(month.amount, monthlyFixedCosts(fixedCosts, now));
  const digits = tickerDigits(rates.aroundTheClock.second, currency, language);
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
            copy={copy}
            hidden={amountsHidden}
            parts={formatTicker(today.aroundTheClock, currency, language, digits)}
          />
          <p className="stat-note">{copy.t('earnings.todayNote')}</p>
        </div>
        <div className="stat-card earnings-work" data-state={today.progress.state}>
          <p className="stat-label">{copy.t('earnings.atWork')}</p>
          <LiveAmount
            copy={copy}
            hidden={amountsHidden}
            parts={formatTicker(today.atWork, currency, language, digits)}
          />
          <WorkStatus copy={copy} progress={today.progress} />
        </div>
        <ProgressCard
          amount={formatEarned(month.amount, currency, language)}
          caption={copy.t('earnings.workdays', {
            done: month.workdaysDone,
            total: month.workdaysTotal,
          })}
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
            caption={copy.t(
              coverage.share >= 1 ? 'earnings.fixedCostsAllCovered' : 'earnings.fixedCostsCovered',
            )}
            className="earnings-fixed-costs"
            copy={copy}
            hidden={amountsHidden}
            label={copy.t('earnings.fixedCosts')}
            share={coverage.share}
            spokenShare={(percentage) => copy.t('earnings.fixedCostsShare', { percentage })}
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
