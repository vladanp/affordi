import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import type { Bill } from '../domain/bills';
import type { FixedCost } from '../domain/fixedCosts';
import { summarizeMonth } from '../domain/monthly';
import { CalendarClock, Repeat } from 'lucide-react';

import { isPriceRepeat, priceRepeats, type PriceRepeat } from '../domain/calculations';
import { createTranslator, type Translator } from '../domain/i18n';
import { getCurrencySymbol } from '../domain/locale';
import { describeAnnouncement, describeResult, type PriceResult } from '../domain/priceResult';
import type { AffordiSettings } from '../domain/storage';
import { useDecimalInput } from './useDecimalInput';
import { useNow } from './useNow';

/** Screen readers hear the result once typing pauses instead of on every keystroke. */
const ANNOUNCEMENT_DELAY_MS = 700;
/** When a price will have been earned is shown to the minute. */
const CLOCK_MS = 60_000;

interface CalculatorProps {
  settings: AffordiSettings;
  bills?: readonly Bill[];
  fixedCosts?: readonly FixedCost[];
}

interface PriceRepeatFieldProps {
  copy: Translator;
  onChange: (repeat: PriceRepeat) => void;
  value: PriceRepeat;
}

/** A compact select, because five choices do not fit a segmented control on a phone. */
function PriceRepeatField({ copy, onChange, value }: PriceRepeatFieldProps) {
  return (
    <span className={`price-repeat${value === 'once' ? '' : ' price-repeat-active'}`}>
      <Repeat aria-hidden="true" className="price-repeat-icon" size={16} strokeWidth={2} />
      <label className="visually-hidden" htmlFor="price-repeat">
        {copy.t('calculator.repeatLabel')}
      </label>
      <select
        id="price-repeat"
        onChange={(event) => {
          if (isPriceRepeat(event.target.value)) onChange(event.target.value);
        }}
        value={value}
      >
        {priceRepeats.map((option) => (
          <option key={option} value={option}>
            {copy.t(`calculator.repeat.${option}`)}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="select-chevron" />
    </span>
  );
}

/** Supporting lines under the headline, ending with the share of pay and its meter. */
function ResultNote({ result }: { result: PriceResult }) {
  return (
    <p className="result-note" aria-hidden={result.repeatNote === null && result.earnedBy === null}>
      {result.repeatNote !== null ? (
        <Repeat aria-hidden="true" size={16} strokeWidth={2} />
      ) : result.earnedBy !== null ? (
        <CalendarClock aria-hidden="true" size={16} strokeWidth={2} />
      ) : null}
      <span className={result.repeatNote === null ? 'result-earned-by' : 'result-repeat'}>
        {result.repeatNote ?? result.earnedBy ?? '\u00a0'}
      </span>
    </p>
  );
}

function ResultContext({ result }: { result: PriceResult }) {
  const over = result.shareSegments.length > 1;
  return (
    <div className="result-context">
      <p className="result-approx" aria-hidden={result.secondary === null}>
        {result.secondary === null ? '\u00a0' : `≈ ${result.secondary}`}
      </p>
      <ResultNote result={result} />
      <div className={`result-share${over ? ' result-share-over' : ''}`}>
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
  );
}

interface ResultPanelProps {
  result: PriceResult;
  resultRef: RefObject<HTMLDivElement | null>;
}

/** The time a price costs, read with the price it is for. */
function ResultPanel({ result, resultRef }: ResultPanelProps) {
  return (
    <div className="result-card" id="calculator-result" ref={resultRef}>
      <p className="result-primary">
        <span className="visually-hidden">{result.label} </span>
        {result.primary}
      </p>
      <ResultContext result={result} />
    </div>
  );
}

function useDelayedValue(value: string, delay: number): string {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return delayed;
}

const emptyBills: readonly Bill[] = [];
const emptyCosts: readonly FixedCost[] = [];

function calculateContext(
  price: number | null,
  repeat: PriceRepeat,
  settings: AffordiSettings,
  bills: readonly Bill[],
  fixedCosts: readonly FixedCost[],
  disposable: boolean,
  now: Date,
) {
  const left = summarizeMonth(fixedCosts, bills, settings, now)?.left ?? 0;
  const noDisposable = disposable && left <= 0;
  const resultSettings: AffordiSettings = disposable
    ? { ...settings, netIncome: left, payFrequency: 'monthly' }
    : settings;
  const result = noDisposable ? null : describeResult(price, repeat, resultSettings, now);
  return { result, noDisposable };
}

function dismissPrice(event: FormEvent<HTMLFormElement>, result: HTMLDivElement | null) {
  event.preventDefault();
  const active = event.currentTarget.ownerDocument.activeElement;
  if (active instanceof HTMLElement && event.currentTarget.contains(active)) active.blur();
  result?.scrollIntoView?.({ block: 'nearest' });
}

function useCalculator({ settings, bills = emptyBills, fixedCosts = emptyCosts }: CalculatorProps) {
  const [disposable, setDisposable] = useState(false);
  const priceDraft = useDecimalInput('', settings.language);
  const itemPrice = priceDraft.value;
  const setItemPrice = priceDraft.setValue;
  const [repeat, setRepeat] = useState<PriceRepeat>('once');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const copy = createTranslator(settings.language);
  const price = priceDraft.amount;
  const now = useNow(CLOCK_MS);
  const { result, noDisposable } = calculateContext(
    price,
    repeat,
    settings,
    bills,
    fixedCosts,
    disposable,
    now,
  );
  const priceError =
    itemPrice.trim() !== '' && (price === null || price < 0 || (!noDisposable && result === null));
  let announcement = result === null ? '' : describeAnnouncement(result);
  if (priceError) announcement = copy.t('calculator.priceError');
  const spokenResult = useDelayedValue(announcement, ANNOUNCEMENT_DELAY_MS);

  return {
    disposable,
    setDisposable,
    itemPrice,
    setItemPrice,
    repeat,
    setRepeat,
    priceInputRef,
    resultRef,
    copy,
    price,
    result,
    noDisposable,
    priceError,
    spokenResult,
  };
}

export function Calculator(props: CalculatorProps) {
  const { settings, bills = emptyBills, fixedCosts = emptyCosts } = props;
  const {
    disposable,
    setDisposable,
    itemPrice,
    setItemPrice,
    repeat,
    setRepeat,
    priceInputRef,
    resultRef,
    copy,
    price,
    result,
    noDisposable,
    priceError,
    spokenResult,
  } = useCalculator(props);
  return (
    <section aria-labelledby="calculator-title" className="calculator">
      <h1 id="calculator-title" tabIndex={-1}>
        {copy.t('calculator.title')}
      </h1>

      <form className="price-field" onSubmit={(event) => dismissPrice(event, resultRef.current)}>
        <span className="price-input-wrap">
          <span aria-hidden="true" className="currency-symbol">
            {getCurrencySymbol(settings.currency, settings.language)}
          </span>
          <input
            aria-describedby={
              priceError ? 'price-currency-description price-error' : 'price-currency-description'
            }
            aria-invalid={priceError}
            aria-labelledby="calculator-title"
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
          <button
            aria-controls={result === null ? undefined : 'calculator-result'}
            className="price-done-button"
            type="submit"
          >
            {copy.t('calculator.done')}
          </button>
        </span>
        <small className="visually-hidden" id="price-currency-description">
          {copy.t('calculator.priceDescription', { currency: settings.currency })}
        </small>
        <PriceRepeatField copy={copy} onChange={setRepeat} value={repeat} />
        <small
          aria-hidden={!priceError}
          className={`field-error price-error${priceError ? '' : ' price-error-hidden'}`}
          id="price-error"
        >
          {copy.t('calculator.priceError')}
        </small>
      </form>

      {(bills.length > 0 || fixedCosts.length > 0) && (
        <label className="option-toggle disposable-toggle">
          <input
            type="checkbox"
            checked={disposable}
            onChange={(event) => setDisposable(event.target.checked)}
          />
          {copy.t('calculator.disposable')}
        </label>
      )}
      {noDisposable && price !== null && (
        <div className="result-card">
          <p className="result-primary">{copy.t('calculator.noDisposable')}</p>
        </div>
      )}
      {result !== null && <ResultPanel result={result} resultRef={resultRef} />}
      <p aria-atomic="true" aria-live="polite" className="visually-hidden">
        {spokenResult}
      </p>
    </section>
  );
}
