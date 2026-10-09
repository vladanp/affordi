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

function formatIncomePercentage(percentage: number, locale: string): string {
  const options = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;
  if (percentage > 0 && percentage < 0.1) {
    return `<${(0.1).toLocaleString(locale, options)}`;
  }
  return percentage.toLocaleString(locale, options);
}

interface PriceResult {
  label: string;
  primary: string;
  secondary: string | null;
  share: string;
  shareWidth: string;
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
    shareWidth: `${Math.min(percentage, 100)}%`,
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
            <div className="result-share">
              <p>{result.share}</p>
              <span aria-hidden="true" className="share-meter">
                <span style={{ inlineSize: result.shareWidth }} />
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
