import { useState, type FormEvent } from 'react';

import { isPayFrequency, payFrequencies } from '../domain/calculations';
import { createTranslator, isLocale, supportedLocales, type Translator } from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { currencyOptions, getCurrencySymbol, isCurrencyCode } from '../domain/locale';
import { defaultSettings, type AffordiSettings } from '../domain/storage';
import { isThemePreference, themePreferences } from '../domain/theme';

interface IncomeFormProps {
  initialValues?: AffordiSettings;
  mode?: 'setup' | 'edit';
  onCancel?: () => void;
  onSubmit: (settings: AffordiSettings) => void;
}

interface FormValues {
  netIncome: string;
  payFrequency: string;
  weeklyHours: string;
  workingDaysPerWeek: string;
  currency: string;
  language: string;
  theme: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;
type UpdateField = (name: keyof FormValues, value: string) => void;

interface TextFieldProps {
  error: string | undefined;
  inputMode: 'decimal' | 'numeric';
  label: string;
  name: 'weeklyHours' | 'workingDaysPerWeek';
  onChange: UpdateField;
  value: string;
}

function TextField({ error, inputMode, label, name, onChange, value }: TextFieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== undefined}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type="text"
        value={value}
      />
      {error && (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      )}
    </label>
  );
}

interface SelectFieldProps {
  error: string | undefined;
  label: string;
  name: 'payFrequency' | 'currency' | 'language' | 'theme';
  onChange: UpdateField;
  options: readonly { label: string; value: string }[];
  value: string;
}

function SelectField({ error, label, name, onChange, options, value }: SelectFieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className="field">
      <span>{label}</span>
      <select
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== undefined}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      )}
    </label>
  );
}

function valuesFromSettings(settings: AffordiSettings): FormValues {
  return {
    netIncome: String(settings.netIncome),
    payFrequency: settings.payFrequency,
    weeklyHours: String(settings.weeklyHours),
    workingDaysPerWeek: String(settings.workingDaysPerWeek),
    currency: settings.currency,
    language: settings.language,
    theme: settings.theme,
  };
}

function validate(
  values: FormValues,
  copy: Translator,
): { settings?: AffordiSettings; errors: FormErrors } {
  const errors: FormErrors = {};
  const netIncome = parseDecimalInput(values.netIncome, copy.locale);
  const weeklyHours = parseDecimalInput(values.weeklyHours, copy.locale);
  const workingDays = parseDecimalInput(values.workingDaysPerWeek, copy.locale);
  const payFrequency = isPayFrequency(values.payFrequency) ? values.payFrequency : null;
  const currency = isCurrencyCode(values.currency) ? values.currency : null;
  const language = isLocale(values.language) ? values.language : null;
  const theme = isThemePreference(values.theme) ? values.theme : null;

  if (netIncome === null || netIncome <= 0) errors.netIncome = copy.t('validation.income');
  if (payFrequency === null) errors.payFrequency = copy.t('validation.payFrequency');
  if (weeklyHours === null || weeklyHours <= 0 || weeklyHours > 168) {
    errors.weeklyHours = copy.t('validation.weeklyHours');
  }
  if (
    workingDays === null ||
    !Number.isInteger(workingDays) ||
    workingDays < 1 ||
    workingDays > 7
  ) {
    errors.workingDaysPerWeek = copy.t('validation.workingDays');
  }
  if (currency === null) errors.currency = copy.t('validation.currency');
  if (language === null) errors.language = copy.t('validation.language');
  if (theme === null) errors.theme = copy.t('validation.theme');

  if (
    Object.keys(errors).length > 0 ||
    netIncome === null ||
    weeklyHours === null ||
    workingDays === null ||
    payFrequency === null ||
    currency === null ||
    language === null ||
    theme === null
  ) {
    return { errors };
  }

  return {
    errors,
    settings: {
      netIncome,
      payFrequency,
      weeklyHours,
      workingDaysPerWeek: workingDays,
      currency,
      language,
      theme,
    },
  };
}

export function IncomeForm({ initialValues, mode = 'setup', onCancel, onSubmit }: IncomeFormProps) {
  const [values, setValues] = useState<FormValues>(() => {
    if (initialValues !== undefined) return valuesFromSettings(initialValues);
    const defaults = defaultSettings();
    return { ...valuesFromSettings(defaults), netIncome: '' };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const copy = createTranslator(values.language);

  function update(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(values, copy);
    setErrors(result.errors);
    if (result.settings !== undefined) {
      onSubmit(result.settings);
      return;
    }

    const firstInvalidName = Object.keys(result.errors)[0];
    const firstInvalidControl = event.currentTarget.elements.namedItem(firstInvalidName ?? '');
    if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
  }

  return (
    <form className="income-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        {mode === 'setup' && <h2>{copy.t('form.heading')}</h2>}
        {mode === 'setup' && <p>{copy.t('form.setupNote')}</p>}
      </div>

      <label className="field">
        <span>{copy.t('form.incomeLabel')}</span>
        <span className="input-with-prefix">
          <span aria-hidden="true">
            {isCurrencyCode(values.currency)
              ? getCurrencySymbol(values.currency, copy.locale)
              : values.currency}
          </span>
          <span aria-hidden="true" className="currency-code">
            {values.currency}
          </span>
          <input
            aria-label={copy.t('form.incomeLabel')}
            aria-describedby={
              errors.netIncome
                ? 'income-currency-description income-error'
                : 'income-currency-description'
            }
            aria-invalid={errors.netIncome !== undefined}
            inputMode="decimal"
            name="netIncome"
            onChange={(event) => update('netIncome', event.target.value)}
            placeholder="3000"
            type="text"
            value={values.netIncome}
          />
        </span>
        <small className="visually-hidden" id="income-currency-description">
          {copy.t('form.incomeDescription', { currency: values.currency })}
        </small>
        {errors.netIncome && (
          <small className="field-error" id="income-error">
            {errors.netIncome}
          </small>
        )}
      </label>

      <SelectField
        error={errors.payFrequency}
        label={copy.t('form.payFrequencyLabel')}
        name="payFrequency"
        onChange={update}
        options={payFrequencies.map((frequency) => ({
          label: copy.payFrequency(frequency),
          value: frequency,
        }))}
        value={values.payFrequency}
      />
      <TextField
        error={errors.weeklyHours}
        inputMode="decimal"
        label={copy.t('form.weeklyHoursLabel')}
        name="weeklyHours"
        onChange={update}
        value={values.weeklyHours}
      />
      <TextField
        error={errors.workingDaysPerWeek}
        inputMode="numeric"
        label={copy.t('form.workingDaysLabel')}
        name="workingDaysPerWeek"
        onChange={update}
        value={values.workingDaysPerWeek}
      />
      <SelectField
        error={errors.currency}
        label={copy.t('form.currencyLabel')}
        name="currency"
        onChange={update}
        options={currencyOptions.map((currency) => ({ label: currency, value: currency }))}
        value={values.currency}
      />
      {mode === 'edit' && (
        <>
          <SelectField
            error={errors.language}
            label={copy.t('form.languageLabel')}
            name="language"
            onChange={update}
            options={supportedLocales.map((language) => ({
              label: copy.language(language),
              value: language,
            }))}
            value={values.language}
          />
          <SelectField
            error={errors.theme}
            label={copy.t('form.themeLabel')}
            name="theme"
            onChange={update}
            options={themePreferences.map((theme) => ({ label: copy.theme(theme), value: theme }))}
            value={values.theme}
          />
        </>
      )}

      <div className="form-actions">
        {onCancel && (
          <button className="button button-quiet" onClick={onCancel} type="button">
            {copy.t('form.cancel')}
          </button>
        )}
        <button className="button button-primary" type="submit">
          {mode === 'setup' ? copy.t('form.start') : copy.t('form.save')}
        </button>
      </div>
    </form>
  );
}
