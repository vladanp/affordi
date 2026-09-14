import { useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react';

import {
  calculateHoursPerWorkday,
  calculateIncomePercentage,
  calculateWorkHours,
} from '../domain/calculations';
import { formatPrimaryDuration, formatWorkDuration } from '../domain/duration';
import { createTranslator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { formatCurrency, getCurrencySymbol } from '../domain/locale';
import type { AffordiSettings } from '../domain/storage';

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

export function Calculator({ settings, onOpenSettings, settingsButtonRef }: CalculatorProps) {
  const [itemPrice, setItemPrice] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const copy = createTranslator(settings.language);
  const parsedPrice = parseDecimalInput(itemPrice, settings.language);
  const workHours = parsedPrice === null ? null : calculateWorkHours(parsedPrice, settings);
  const duration =
    workHours === null ? null : formatPrimaryDuration(workHours, settings, settings.language);
  const hoursPerWorkday = calculateHoursPerWorkday(settings);
  const secondaryDuration =
    workHours === null || hoursPerWorkday === null || workHours < hoursPerWorkday
      ? null
      : formatWorkDuration(workHours, settings, settings.language);
  const percentage = parsedPrice === null ? null : calculateIncomePercentage(parsedPrice, settings);
  const hasInput = itemPrice.trim() !== '';
  const priceError = hasInput && (parsedPrice === null || workHours === null);

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    setItemPrice(event.target.value);
  }

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
    <section aria-labelledby="calculator-title" className="calculator-card">
      <div className="calculator-topline">
        <p className="eyebrow">Affordi</p>
        <button
          className="text-button"
          onClick={onOpenSettings}
          ref={settingsButtonRef}
          type="button"
        >
          {copy.t('calculator.settings')}
        </button>
      </div>
      <h1 id="calculator-title">{copy.t('calculator.title')}</h1>

      <form className="price-field" onSubmit={handlePriceSubmit}>
        <label className="visually-quiet" htmlFor="item-price">
          {copy.t('calculator.priceLabel')}
        </label>
        <span className="price-input-wrap">
          <span aria-hidden="true" className="currency-symbol">
            {getCurrencySymbol(settings.currency, settings.language)}
          </span>
          <input
            aria-label={copy.t('calculator.priceLabel')}
            aria-describedby={
              priceError ? 'price-currency-description price-error' : 'price-currency-description'
            }
            aria-invalid={priceError}
            autoComplete="off"
            enterKeyHint="done"
            id="item-price"
            inputMode="decimal"
            onChange={handlePriceChange}
            placeholder="750"
            ref={priceInputRef}
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

      {duration !== null && percentage !== null && parsedPrice !== null ? (
        <div aria-live="polite" className="result-panel" id="calculator-result" ref={resultRef}>
          <p className="result-label">
            {copy.t('calculator.resultIs', {
              price: formatCurrency(parsedPrice, settings.currency, settings.language),
            })}
          </p>
          <p className="result-secondary">
            {secondaryDuration !== null && <span>≈ {secondaryDuration}</span>}
            <span className="result-percentage">
              {copy.t('calculator.payContext', {
                percentage: formatIncomePercentage(percentage, settings.language),
                period: copy.payPeriod(settings.payFrequency),
              })}
            </span>
          </p>
          <p className="result-primary">{duration}</p>
        </div>
      ) : (
        <div aria-live="polite" className="empty-result" id="calculator-result" ref={resultRef}>
          <span>{copy.t('calculator.emptyResult')}</span>
        </div>
      )}
    </section>
  );
}
