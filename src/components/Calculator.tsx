import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Hourglass, Repeat } from 'lucide-react';

import { isPriceRepeat, priceRepeats, type PriceRepeat } from '../domain/calculations';
import { createTranslator, type Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { getCurrencySymbol } from '../domain/locale';
import { describeAnnouncement, describeResult, type PriceResult } from '../domain/priceResult';
import type { AffordiSettings } from '../domain/storage';

/** Screen readers hear the result once typing pauses instead of on every keystroke. */
const ANNOUNCEMENT_DELAY_MS = 700;

interface CalculatorProps {
  settings: AffordiSettings;
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
function ResultContext({ result }: { result: PriceResult }) {
  const over = result.shareSegments.length > 1;
  return (
    <div className="result-context">
      {result.secondary !== null && <p className="result-approx">≈ {result.secondary}</p>}
      {result.repeatNote !== null && (
        <p className="result-note">
          <Repeat aria-hidden="true" size={16} strokeWidth={2} />
          <span>{result.repeatNote}</span>
        </p>
      )}
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
  copy: Translator;
  result: PriceResult | null;
  resultRef: RefObject<HTMLDivElement | null>;
}

/** The result card, or a quiet placeholder until a valid price is entered. */
function ResultPanel({ copy, result, resultRef }: ResultPanelProps) {
  if (result === null) {
    return (
      <div className="result-empty" id="calculator-result" ref={resultRef}>
        <Hourglass aria-hidden="true" size={22} strokeWidth={1.75} />
        <p>{copy.t('calculator.emptyResult')}</p>
      </div>
    );
  }

  return (
    <div className="result-card" id="calculator-result" ref={resultRef}>
      <p className="result-label">{result.label}</p>
      <p className="result-primary">{result.primary}</p>
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

export function Calculator({ settings }: CalculatorProps) {
  const [itemPrice, setItemPrice] = useState('');
  const [repeat, setRepeat] = useState<PriceRepeat>('once');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const copy = createTranslator(settings.language);
  const price = parseDecimalInput(itemPrice, settings.language);
  const result = describeResult(price, repeat, settings);
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
        <PriceRepeatField copy={copy} onChange={setRepeat} value={repeat} />
        <small
          aria-hidden={!priceError}
          className={`field-error price-error${priceError ? '' : ' price-error-hidden'}`}
          id="price-error"
        >
          {copy.t('calculator.priceError')}
        </small>
      </form>

      <ResultPanel copy={copy} result={result} resultRef={resultRef} />
      <p aria-atomic="true" aria-live="polite" className="visually-hidden">
        {spokenResult}
      </p>
    </section>
  );
}
