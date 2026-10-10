import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Hourglass, LockKeyhole, Settings2 } from 'lucide-react';

import { Brand } from './Brand';
import {
  calculateIncomePercentage,
  calculateWorkHours,
  incomeComparisonPeriod,
} from '../domain/calculations';
import { formatPrimaryDuration, formatSecondaryDuration } from '../domain/duration';
import { createTranslator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { formatCurrency, getCurrencySymbol } from '../domain/locale';
import type { AffordiSettings } from '../domain/storage';

/** Screen readers hear the result once typing pauses instead of on every keystroke. */
const ANNOUNCEMENT_DELAY_MS = 700;

interface CalculatorProps {
  settings: AffordiSettings;
  onOpenSettings: () => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
}

/** Whole percentages read faster; anything that would round to 0% shows as under 1%. */
function formatIncomePercentage(percentage: number, locale: string): string {
  const options = { maximumFractionDigits: 0 } as const;
  if (percentage > 0 && percentage < 0.5) {
    return `<${(1).toLocaleString(locale, options)}`;
  }
  return percentage.toLocaleString(locale, options);
}

/** Each meter segment is one pay period; long bars stop at a readable number of segments. */
const MAX_SHARE_SEGMENTS = 12;

interface ShareSegment {
  period: number;
  fill: number;
}

function shareSegments(percentage: number): ShareSegment[] {
  const periods = percentage / 100;
  // Split only when the rounded percentage shown beside the meter is above 100%.
  const count =
    Math.round(percentage) <= 100 ? 1 : Math.min(Math.ceil(periods), MAX_SHARE_SEGMENTS);
  return Array.from({ length: count }, (_, index) => ({
    period: index + 1,
    fill: Math.min(Math.max(periods - index, 0), 1),
  }));
}

/** How many pay periods a price spans, shown from 1.1 periods so it never reads as 1.0×. */
function formatPayMultiple(percentage: number, locale: string): string | null {
  const periods = percentage / 100;
  if (Math.round(periods * 10) < 11) return null;
  const digits = periods < 10 ? 1 : 0;
  const multiple = periods.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${multiple}×`;
}

interface PriceResult {
  label: string;
  primary: string;
  secondary: string | null;
  share: string;
  shareMultiple: string | null;
  shareSegments: ShareSegment[];
}

/** Builds every piece of result copy for a valid price, or null when there is no result. */
function describeResult(price: number | null, settings: AffordiSettings): PriceResult | null {
  if (price === null) return null;
  const workHours = calculateWorkHours(price, settings);
  const percentage = calculateIncomePercentage(price, settings);
  const primary =
    workHours === null ? null : formatPrimaryDuration(workHours, settings, settings.language);
  if (workHours === null || percentage === null || primary === null) return null;

  const copy = createTranslator(settings.language);
  return {
    label: copy.t('calculator.resultIs', {
      price: formatCurrency(price, settings.currency, settings.language),
    }),
    primary,
    secondary: formatSecondaryDuration(workHours, settings, settings.language),
    share: copy.t('calculator.payContext', {
      percentage: formatIncomePercentage(percentage, settings.language),
      period: copy.payPeriod(incomeComparisonPeriod(settings.payFrequency)),
    }),
    shareMultiple: formatPayMultiple(percentage, settings.language),
    shareSegments: shareSegments(percentage),
  };
}

/** The sentence screen readers hear once the result settles. */
function describeAnnouncement(result: PriceResult): string {
  const approximate = result.secondary === null ? [] : [`≈ ${result.secondary}`];
  return [`${result.label} ${result.primary}`, ...approximate, result.share].join('. ');
}

function useDelayedValue(value: string, delay: number): string {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return delayed;
}

export function Calculator({ settings, onOpenSettings, settingsButtonRef }: CalculatorProps) {
  const [itemPrice, setItemPrice] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const copy = createTranslator(settings.language);
  const result = describeResult(parseDecimalInput(itemPrice, settings.language), settings);
  const priceError = itemPrice.trim() !== '' && result === null;
  let announcement = result === null ? '' : describeAnnouncement(result);
  if (priceError) announcement = copy.t('calculator.priceError');
  const spokenResult = useDelayedValue(announcement, ANNOUNCEMENT_DELAY_MS);

  function handlePriceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeElement = event.currentTarget.ownerDocument.activeElement;
    if (activeElement instanceof HTMLElement && event.currentTarget.contains(activeElement)) {
      activeElement.blur();
    }
    priceInputRef.current?.blur();
    resultRef.current?.scrollIntoView?.({ block: 'nearest' });
  }

  return (
    <section aria-labelledby="calculator-title" className="calculator">
      <header className="topbar">
        <Brand />
        <button
          className="pill-button"
          onClick={onOpenSettings}
          ref={settingsButtonRef}
          type="button"
        >
          <Settings2 aria-hidden="true" size={18} strokeWidth={2} />
          <span>{copy.t('calculator.settings')}</span>
        </button>
      </header>
      <h1 id="calculator-title">{copy.t('calculator.title')}</h1>

      <form className="price-field" onSubmit={handlePriceSubmit}>
        <label className="price-label" htmlFor="item-price">
          {copy.t('calculator.priceLabel')}
        </label>
        <span className="price-input-wrap">
          <span aria-hidden="true" className="currency-symbol">
            {getCurrencySymbol(settings.currency, settings.language)}
          </span>
          <input
            aria-describedby={
              priceError ? 'price-currency-description price-error' : 'price-currency-description'
            }
            aria-invalid={priceError}
            autoComplete="off"
            enterKeyHint="done"
            id="item-price"
            inputMode="decimal"
            onChange={(event) => setItemPrice(event.target.value)}
            placeholder="750"
            ref={priceInputRef}
            spellCheck={false}
            type="text"
            value={itemPrice}
          />
          <button aria-controls="calculator-result" className="price-done-button" type="submit">
            {copy.t('calculator.done')}
          </button>
        </span>
        <small className="visually-hidden" id="price-currency-description">
          {copy.t('calculator.priceDescription', { currency: settings.currency })}
        </small>
        <small
          aria-hidden={!priceError}
          className={`field-error price-error${priceError ? '' : ' price-error-hidden'}`}
          id="price-error"
        >
          {copy.t('calculator.priceError')}
        </small>
      </form>

      {result === null ? (
        <div className="result-empty" id="calculator-result" ref={resultRef}>
          <Hourglass aria-hidden="true" size={22} strokeWidth={1.75} />
          <p>{copy.t('calculator.emptyResult')}</p>
        </div>
      ) : (
        <div className="result-card" id="calculator-result" ref={resultRef}>
          <p className="result-label">{result.label}</p>
          <p className="result-primary">{result.primary}</p>
          <div className="result-context">
            {result.secondary !== null && <p className="result-approx">≈ {result.secondary}</p>}
            <div
              className={`result-share${result.shareSegments.length > 1 ? ' result-share-over' : ''}`}
            >
              <div className="share-row">
                <p>{result.share}</p>
                {result.shareMultiple !== null && (
                  <span aria-hidden="true" className="share-multiple">
                    {result.shareMultiple}
                  </span>
                )}
              </div>
              <span aria-hidden="true" className="share-meter">
                {result.shareSegments.map((segment) => (
                  <span className="share-segment" key={segment.period}>
                    <span style={{ inlineSize: `${segment.fill * 100}%` }} />
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}
      <p aria-atomic="true" aria-live="polite" className="visually-hidden">
        {spokenResult}
      </p>

      <p className="local-only-footer">
        <LockKeyhole aria-hidden="true" size={14} strokeWidth={2} />
        <span>{copy.t('privacy.localOnly')}</span>
      </p>
    </section>
  );
}
