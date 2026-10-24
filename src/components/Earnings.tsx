import { useSyncExternalStore } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import {
  calculateEarnedThisMonth,
  calculateEarnedToday,
  calculateEarningRates,
  rateUnits,
  totalPeriods,
  type EarnedThisMonth,
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
import { createTranslator, type Translator } from '../domain/i18n';
import type { WorkProgress } from '../domain/schedule';
import type { AffordiSettings } from '../domain/storage';
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

function HiddenAmount({ copy }: { copy: Translator }) {
  return (
    <>
      <span aria-hidden="true">••••</span>
      <span className="visually-hidden">{copy.t('earnings.hiddenAmount')}</span>
    </>
  );
}

interface LiveAmountProps {
  copy: Translator;
  hidden: boolean;
  parts: TickerParts;
}

/** A live total for today, with the digits beyond the currency's usual precision set smaller. */
function LiveAmount({ copy, hidden, parts }: LiveAmountProps) {
  return (
    <p className="live-amount">
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

interface MonthProgressProps {
  copy: Translator;
  currency: string;
  hidden: boolean;
  month: EarnedThisMonth;
  total: number;
}

/**
 * Progress toward this month's pay by work time, in the currency's usual precision
 * since a monthly total needs no live digits. The share stays visible when amounts hide.
 */
function MonthProgress({ copy, currency, hidden, month, total }: MonthProgressProps) {
  const percentage = formatProgress(month.share, copy.locale);
  return (
    <div className="earnings-card earnings-month">
      <p className="earnings-label">{copy.t('earnings.month')}</p>
      <p className="live-amount month-amount">
        {hidden ? (
          <HiddenAmount copy={copy} />
        ) : (
          <>
            {formatEarned(month.amount, currency, copy.locale)}{' '}
            <span className="month-total">
              {copy.t('earnings.monthTotal', {
                total: formatRate(total, currency, copy.locale),
              })}
            </span>
          </>
        )}
      </p>
      <span aria-hidden="true" className="month-meter">
        <span style={{ inlineSize: `${month.share * 100}%` }} />
      </span>
      <p className="earnings-note month-caption">
        <span>
          {copy.t('earnings.workdays', { done: month.workdaysDone, total: month.workdaysTotal })}
        </span>{' '}
        <span className="month-share">
          <span aria-hidden="true">{percentage}</span>
          <span className="visually-hidden">{copy.t('earnings.monthShare', { percentage })}</span>
        </span>
      </p>
    </div>
  );
}

/** The work status, with the time left set on its own line in narrow cards. */
function WorkStatus({ copy, progress }: { copy: Translator; progress: WorkProgress }) {
  const [status, timeLeft] = describeWorkStatus(progress, copy);
  return (
    <p className="earnings-note earnings-status">
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
  settings: AffordiSettings;
  onHideAmountsChange: (hideAmounts: boolean) => void;
}

export function Earnings({ settings, onHideAmountsChange }: EarningsProps) {
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
  const digits = tickerDigits(rates.aroundTheClock.second, currency, language);
  const rate = (value: number) =>
    amountsHidden ? <HiddenAmount copy={copy} /> : formatRate(value, currency, language);

  return (
    <section aria-labelledby="earnings-title" className="earnings">
      <div className="earnings-heading">
        <h1 id="earnings-title">{copy.t('earnings.title')}</h1>
        <button
          aria-label={copy.t(amountsHidden ? 'earnings.showAmounts' : 'earnings.hideAmounts')}
          className="icon-button"
          title={copy.t(amountsHidden ? 'earnings.showAmounts' : 'earnings.hideAmounts')}
          onClick={() => onHideAmountsChange(!amountsHidden)}
          type="button"
        >
          {amountsHidden ? (
            <Eye aria-hidden="true" size={20} strokeWidth={1.75} />
          ) : (
            <EyeOff aria-hidden="true" size={20} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <div className="earnings-cards">
        <div className="earnings-card earnings-today">
          <p className="earnings-label">{copy.t('earnings.today')}</p>
          <LiveAmount
            copy={copy}
            hidden={amountsHidden}
            parts={formatTicker(today.aroundTheClock, currency, language, digits)}
          />
          <p className="earnings-note">{copy.t('earnings.todayNote')}</p>
        </div>
        <div className="earnings-card earnings-work" data-state={today.progress.state}>
          <p className="earnings-label">{copy.t('earnings.atWork')}</p>
          <LiveAmount
            copy={copy}
            hidden={amountsHidden}
            parts={formatTicker(today.atWork, currency, language, digits)}
          />
          <WorkStatus copy={copy} progress={today.progress} />
        </div>
        <MonthProgress
          copy={copy}
          currency={currency}
          hidden={amountsHidden}
          month={month}
          total={rates.totals.month}
        />
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
