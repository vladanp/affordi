import { useState, type ChangeEvent, type RefObject } from 'react';

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

export function Calculator({ settings, onOpenSettings, settingsButtonRef }: CalculatorProps) {
  const [itemPrice, setItemPrice] = useState('');
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

      <label className="price-field">
        <span className="visually-quiet">{copy.t('calculator.priceLabel')}</span>
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
            inputMode="decimal"
            onChange={handlePriceChange}
            placeholder="750"
            type="text"
            value={itemPrice}
          />
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
      </label>

      {duration !== null && percentage !== null && parsedPrice !== null ? (
        <div aria-live="polite" className="result-panel">
          <p className="result-label">
            {copy.t('calculator.resultIs', {
              price: formatCurrency(parsedPrice, settings.currency, settings.language),
            })}
          </p>
          <p className="result-secondary">
            {secondaryDuration !== null && <span>≈ {secondaryDuration}</span>}
            <span className="result-percentage">
              {copy.t('calculator.payContext', {
                percentage: percentage.toLocaleString(settings.language, {
                  maximumFractionDigits: 1,
                }),
                period: copy.payPeriod(settings.payFrequency),
              })}
            </span>
          </p>
          <p className="result-primary">{duration}</p>
        </div>
      ) : (
        <div aria-live="polite" className="empty-result">
          <span>{copy.t('calculator.emptyResult')}</span>
        </div>
      )}
    </section>
  );
}
