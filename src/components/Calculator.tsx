import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Divide, Hourglass, LockKeyhole, PiggyBank, Repeat, Settings2 } from 'lucide-react';

import { Brand } from './Brand';
import { SavedItems, SaveItemForm, useSavedChecks } from './SavedItems';
import { isPriceRepeat, priceRepeats, type PriceRepeat } from '../domain/calculations';
import { createTranslator, type Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { getCurrencySymbol } from '../domain/locale';
import {
  describeAnnouncement,
  describeResult,
  type PriceResult,
  type ResultNote,
} from '../domain/priceResult';
import type { AffordiSettings } from '../domain/storage';

/** Screen readers hear the result once typing pauses instead of on every keystroke. */
const ANNOUNCEMENT_DELAY_MS = 700;

interface CalculatorProps {
  settings: AffordiSettings;
  onOpenSettings: () => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
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

interface PriceUsesFieldProps {
  copy: Translator;
  onChange: (uses: string) => void;
  value: string;
}

/** Optional number of uses for a single purchase, kept to whole numbers. */
function PriceUsesField({ copy, onChange, value }: PriceUsesFieldProps) {
  return (
    <span className="price-uses">
      <label htmlFor="price-uses">{copy.t('calculator.usesLabel')}</label>
      <input
        aria-describedby="price-uses-hint"
        autoComplete="off"
        enterKeyHint="done"
        id="price-uses"
        inputMode="numeric"
        maxLength={7}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        placeholder="1"
        type="text"
        value={value}
      />
      <small className="visually-hidden" id="price-uses-hint">
        {copy.t('calculator.usesHint')}
      </small>
    </span>
  );
}

const noteIcons = { repeat: Repeat, saving: PiggyBank, use: Divide } as const;

function ResultNoteLine({ note }: { note: ResultNote }) {
  const Icon = noteIcons[note.kind];
  return (
    <p className="result-note">
      <Icon aria-hidden="true" size={16} strokeWidth={2} />
      <span>{note.text}</span>
    </p>
  );
}

/** Supporting lines under the headline, ending with the share of pay and its meter. */
function ResultContext({ result }: { result: PriceResult }) {
  const over = result.shareSegments.length > 1;
  return (
    <div className="result-context">
      {result.secondary !== null && <p className="result-approx">≈ {result.secondary}</p>}
      {result.notes.map((note) => (
        <ResultNoteLine key={note.kind} note={note} />
      ))}
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
      {result.footnote !== null && <p className="result-footnote">{result.footnote}</p>}
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

export function Calculator({ settings, onOpenSettings, settingsButtonRef }: CalculatorProps) {
  const [itemPrice, setItemPrice] = useState('');
  const [repeat, setRepeat] = useState<PriceRepeat>('once');
  const [uses, setUses] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saved = useSavedChecks();
  const copy = createTranslator(settings.language);
  const price = parseDecimalInput(itemPrice, settings.language);
  const result = describeResult(price, repeat, Number(uses), settings);
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
      <h1 id="calculator-title" ref={headingRef} tabIndex={-1}>
        {copy.t('calculator.title')}
      </h1>

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
        <div className="price-options">
          <PriceRepeatField copy={copy} onChange={setRepeat} value={repeat} />
          {repeat === 'once' && <PriceUsesField copy={copy} onChange={setUses} value={uses} />}
        </div>
        <small
          aria-hidden={!priceError}
          className={`field-error price-error${priceError ? '' : ' price-error-hidden'}`}
          id="price-error"
        >
          {copy.t('calculator.priceError')}
        </small>
      </form>

      <ResultPanel copy={copy} result={result} resultRef={resultRef} />
      {result !== null && price !== null && (
        <SaveItemForm
          copy={copy}
          onSave={(name) => saved.add(name, price, repeat, settings.currency)}
        />
      )}
      <SavedItems
        checks={saved.checks}
        copy={copy}
        fallbackFocusRef={headingRef}
        onRemove={saved.remove}
        persisted={saved.persisted}
        settings={settings}
      />
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
