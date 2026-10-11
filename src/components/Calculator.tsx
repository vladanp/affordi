import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Hourglass, LockKeyhole, PiggyBank, Repeat, Settings2 } from 'lucide-react';

import { Brand } from './Brand';
import { SavedItems, SaveItemForm, useSavedChecks } from './SavedItems';
import {
  calculateIncomePercentage,
  calculateSavingMonths,
  calculateWorkHours,
  isPriceRepeat,
  paymentsPerYear,
  priceComparison,
  priceRepeats,
  type PriceRepeat,
} from '../domain/calculations';
import {
  formatPrimaryDuration,
  formatSavingDuration,
  formatSecondaryDuration,
  formatTotalDuration,
} from '../domain/duration';
import { createTranslator, type Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { getCurrencySymbol } from '../domain/locale';
import { describePrice, formatIncomePercentage } from '../domain/priceText';
import type { AffordiSettings } from '../domain/storage';

/** Screen readers hear the result once typing pauses instead of on every keystroke. */
const ANNOUNCEMENT_DELAY_MS = 700;

interface CalculatorProps {
  settings: AffordiSettings;
  onOpenSettings: () => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
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

const MONTHS_PER_YEAR = 12;

interface ResultNote {
  kind: 'repeat' | 'saving';
  text: string;
}

interface PriceResult {
  label: string;
  primary: string;
  secondary: string | null;
  note: ResultNote | null;
  share: string;
  shareMultiple: string | null;
  shareSegments: ShareSegment[];
}

/** A recurring price over one year, or over one month for a yearly price. */
function describeRepeatNote(
  workHours: number,
  repeat: Exclude<PriceRepeat, 'once'>,
  settings: AffordiSettings,
  copy: Translator,
): ResultNote | null {
  const yearly = repeat === 'yearly';
  const hours = yearly
    ? workHours / MONTHS_PER_YEAR
    : workHours * paymentsPerYear(repeat, settings.workingDaysPerWeek);
  const duration = formatTotalDuration(hours, settings, settings.language);
  if (duration === null) return null;
  return {
    kind: 'repeat',
    text: copy.t(yearly ? 'calculator.eachMonth' : 'calculator.overYear', { duration }),
  };
}

/**
 * One extra line of context: the other period for a recurring price, or the
 * time to save for a single purchase when monthly savings are set.
 */
function describeNote(
  price: number,
  workHours: number,
  repeat: PriceRepeat,
  settings: AffordiSettings,
  copy: Translator,
): ResultNote | null {
  if (repeat !== 'once') return describeRepeatNote(workHours, repeat, settings, copy);

  const months = calculateSavingMonths(price, settings.monthlySavings);
  const duration = months === null ? null : formatSavingDuration(months, settings.language);
  if (duration === null) return null;
  return { kind: 'saving', text: copy.t('calculator.savingTime', { duration }) };
}

/** Builds every piece of result copy for a valid price, or null when there is no result. */
function describeResult(
  price: number | null,
  repeat: PriceRepeat,
  settings: AffordiSettings,
): PriceResult | null {
  if (price === null) return null;
  const comparison = priceComparison(price, repeat, settings);
  const workHours = calculateWorkHours(price, settings);
  const percentage = calculateIncomePercentage(comparison.amount, settings, comparison.period);
  const primary =
    workHours === null ? null : formatPrimaryDuration(workHours, settings, settings.language);
  if (workHours === null || percentage === null || primary === null) return null;

  const copy = createTranslator(settings.language);
  return {
    label: copy.t('calculator.resultIs', {
      price: describePrice(price, repeat, settings.currency, copy),
    }),
    primary,
    secondary: formatSecondaryDuration(workHours, settings, settings.language),
    note: describeNote(price, workHours, repeat, settings, copy),
    share: copy.t('calculator.payContext', {
      percentage: formatIncomePercentage(percentage, settings.language),
      period: copy.payPeriod(comparison.period),
    }),
    shareMultiple: formatPayMultiple(percentage, settings.language),
    shareSegments: shareSegments(percentage),
  };
}

/** The sentence screen readers hear once the result settles. */
function describeAnnouncement(result: PriceResult): string {
  const approximate = result.secondary === null ? [] : [`≈ ${result.secondary}`];
  const note = result.note === null ? [] : [result.note.text];
  return [`${result.label} ${result.primary}`, ...approximate, ...note, result.share].join('. ');
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

function ResultNoteLine({ note }: { note: ResultNote }) {
  const Icon = note.kind === 'saving' ? PiggyBank : Repeat;
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
      {result.note !== null && <ResultNoteLine note={result.note} />}
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
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saved = useSavedChecks();
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
        <PriceRepeatField copy={copy} onChange={setRepeat} value={repeat} />
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
          <ResultContext result={result} />
        </div>
      )}
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
