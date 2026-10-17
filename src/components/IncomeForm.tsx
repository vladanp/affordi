import { useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import {
  isPayFrequency,
  isWorkingDayCount,
  MAX_HOURS_PER_WORKDAY,
  MAX_WEEKLY_HOURS,
  payFrequencies,
} from '../domain/calculations';
import {
  createTranslator,
  isLocale,
  supportedLocales,
  type Locale,
  type TranslationKey,
  type Translator,
} from '../domain/i18n';
import { parseDecimalInput } from '../domain/input';
import { currencyOptions, getCurrencySymbol, isCurrencyCode } from '../domain/locale';
import { defaultSettings, isValidAffordiSettings, type AffordiSettings } from '../domain/storage';
import { isThemePreference, themePreferences, type ThemePreference } from '../domain/theme';
import { Segmented, type SegmentOption } from './Segmented';

interface IncomeFormBaseProps {
  onSubmit: (settings: AffordiSettings) => void;
}

interface SetupIncomeFormProps extends IncomeFormBaseProps {
  mode?: 'setup';
}

interface EditIncomeFormProps extends IncomeFormBaseProps {
  hidden?: boolean;
  initialValues: AffordiSettings;
  mode: 'edit';
  onCancel: () => void;
  onLanguagePreview: (language: Locale) => void;
  onThemePreview: (theme: ThemePreference) => void;
}

type IncomeFormProps = SetupIncomeFormProps | EditIncomeFormProps;

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

type FieldOption = SegmentOption<string>;

interface TextFieldProps {
  error: string | undefined;
  inputMode: 'decimal' | 'numeric';
  label: string;
  name: 'weeklyHours' | 'workingDaysPerWeek';
  onChange: UpdateField;
  value: string;
}

function FieldError({ error, id }: { error: string | undefined; id: string }) {
  if (error === undefined) return null;
  return (
    <small className="field-error" id={id}>
      {error}
    </small>
  );
}

function TextField({ error, inputMode, label, name, onChange, value }: TextFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== undefined}
        autoComplete="off"
        id={name}
        inputMode={inputMode}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type="text"
        value={value}
      />
      <FieldError error={error} id={errorId} />
    </div>
  );
}

interface SelectFieldProps {
  error: string | undefined;
  label: string;
  name: 'payFrequency' | 'language';
  onChange: UpdateField;
  options: readonly FieldOption[];
  value: string;
}

function SelectField({ error, label, name, onChange, options, value }: SelectFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <span className="select-wrap">
        <select
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error !== undefined}
          id={name}
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
        <span aria-hidden="true" className="select-chevron" />
      </span>
      <FieldError error={error} id={errorId} />
    </div>
  );
}

interface SegmentedFieldProps {
  error: string | undefined;
  label: string;
  name: 'currency' | 'theme';
  onChange: UpdateField;
  options: readonly FieldOption[];
  value: string;
}

/** A radio group styled as a segmented control for short lists of choices. */
function SegmentedField({ error, label, name, onChange, options, value }: SegmentedFieldProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="field segmented-field"
      data-field={name}
    >
      <legend className="field-label">{label}</legend>
      <Segmented
        name={name}
        onChange={(option) => onChange(name, option)}
        options={options}
        value={value}
      />
      <FieldError error={error} id={errorId} />
    </fieldset>
  );
}

interface IncomeFieldProps {
  copy: Translator;
  currency: string;
  error: string | undefined;
  initiallyVisible: boolean;
  onChange: (value: string) => void;
  value: string;
}

/**
 * The income input with a visibility toggle. Each change of visibility mounts a
 * fresh input, because WebKit keeps a focused field in secure text mode after
 * `-webkit-text-security` is removed, which left the digits hidden on iPhone.
 */
function IncomeField({
  copy,
  currency,
  error,
  initiallyVisible,
  onChange,
  value,
}: IncomeFieldProps) {
  const [visible, setVisible] = useState(initiallyVisible);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = useRef(false);

  // Keeps typing in place when the toggle replaces a focused input.
  function attachInput(input: HTMLInputElement | null) {
    inputRef.current = input;
    if (input === null || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function toggleVisibility() {
    const input = inputRef.current;
    restoreFocusRef.current = input !== null && input === input.ownerDocument.activeElement;
    setVisible((current) => !current);
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor="netIncome">
        {copy.t('form.incomeLabel')}
      </label>
      <span className="input-with-prefix">
        <span aria-hidden="true" className="input-prefix">
          {isCurrencyCode(currency) ? getCurrencySymbol(currency, copy.locale) : currency}
        </span>
        <input
          aria-describedby={
            error
              ? 'income-currency-description income-local-note income-error'
              : 'income-currency-description income-local-note'
          }
          aria-invalid={error !== undefined}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          data-masked={!visible}
          enterKeyHint="done"
          id="netIncome"
          inputMode="decimal"
          key={visible ? 'visible' : 'masked'}
          name="netIncome"
          onChange={(event) => onChange(event.target.value)}
          placeholder="3000"
          ref={attachInput}
          spellCheck={false}
          type="text"
          value={value}
        />
        <button
          aria-label={copy.t(visible ? 'privacy.hideIncome' : 'privacy.showIncome')}
          aria-pressed={visible}
          className="income-visibility-button"
          onClick={toggleVisibility}
          type="button"
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={20} strokeWidth={1.75} />
          ) : (
            <Eye aria-hidden="true" size={20} strokeWidth={1.75} />
          )}
        </button>
      </span>
      <small className="visually-hidden" id="income-currency-description">
        {copy.t('form.incomeDescription', { currency })}
      </small>
      <FieldError error={error} id="income-error" />
    </div>
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

const choiceFields = [
  { name: 'payFrequency', isValid: isPayFrequency, message: 'validation.payFrequency' },
  { name: 'currency', isValid: isCurrencyCode, message: 'validation.currency' },
  { name: 'language', isValid: isLocale, message: 'validation.language' },
  { name: 'theme', isValid: isThemePreference, message: 'validation.theme' },
] as const satisfies readonly {
  name: keyof FormValues;
  isValid: (value: unknown) => boolean;
  message: TranslationKey;
}[];

/** Field names in the order they appear, so focus lands on the first visible problem. */
const fieldOrder = [
  'netIncome',
  'payFrequency',
  'currency',
  'weeklyHours',
  'workingDaysPerWeek',
  'language',
  'theme',
] as const satisfies readonly (keyof FormValues)[];

function scheduleErrors(
  weeklyHours: number | null,
  workingDays: number | null,
  copy: Translator,
): FormErrors {
  const errors: FormErrors = {};
  if (!isWorkingDayCount(workingDays)) {
    errors.workingDaysPerWeek = copy.t('validation.workingDays');
  }

  if (weeklyHours === null || weeklyHours < 1 || weeklyHours > MAX_WEEKLY_HOURS) {
    errors.weeklyHours = copy.t('validation.weeklyHours');
  } else if (isWorkingDayCount(workingDays) && weeklyHours > workingDays * MAX_HOURS_PER_WORKDAY) {
    errors.weeklyHours = copy.t('validation.hoursPerDay');
  }
  return errors;
}

function validate(
  values: FormValues,
  copy: Translator,
): { settings?: AffordiSettings; errors: FormErrors } {
  const netIncome = parseDecimalInput(values.netIncome, copy.locale);
  const weeklyHours = parseDecimalInput(values.weeklyHours, copy.locale);
  const workingDaysPerWeek = parseDecimalInput(values.workingDaysPerWeek, copy.locale);
  const errors = scheduleErrors(weeklyHours, workingDaysPerWeek, copy);

  if (netIncome === null || netIncome <= 0) errors.netIncome = copy.t('validation.income');
  for (const field of choiceFields) {
    if (!field.isValid(values[field.name])) errors[field.name] = copy.t(field.message);
  }

  const candidate = {
    netIncome,
    payFrequency: values.payFrequency,
    weeklyHours,
    workingDaysPerWeek,
    currency: values.currency,
    language: values.language,
    theme: values.theme,
  };
  if (Object.keys(errors).length > 0 || !isValidAffordiSettings(candidate)) return { errors };
  return { errors, settings: candidate };
}

export function IncomeForm(props: IncomeFormProps) {
  const editMode = props.mode === 'edit';
  const [values, setValues] = useState<FormValues>(() => {
    if (props.mode === 'edit') return valuesFromSettings(props.initialValues);
    const defaults = defaultSettings();
    return { ...valuesFromSettings(defaults), netIncome: '' };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const copy = createTranslator(values.language);

  function update(name: keyof FormValues, value: string) {
    if (props.mode === 'edit' && name === 'theme' && isThemePreference(value)) {
      props.onThemePreview(value);
    }
    if (props.mode === 'edit' && name === 'language' && isLocale(value)) {
      props.onLanguagePreview(value);
    }
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validate(values, copy);
    setErrors(result.errors);
    if (result.settings !== undefined) {
      props.onSubmit(result.settings);
      return;
    }

    const firstInvalidName = fieldOrder.find((name) => result.errors[name] !== undefined);
    const firstInvalidControl = event.currentTarget.elements.namedItem(firstInvalidName ?? '');
    if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
  }

  return (
    <form
      className={`income-form${editMode ? '' : ' setup-card'}`}
      hidden={props.mode === 'edit' && props.hidden === true}
      noValidate
      onSubmit={handleSubmit}
    >
      {!editMode && (
        <div className="form-heading">
          <h2>{copy.t('form.heading')}</h2>
          <p>{copy.t('form.setupNote')}</p>
        </div>
      )}

      <IncomeField
        copy={copy}
        currency={values.currency}
        error={errors.netIncome}
        initiallyVisible={!editMode}
        onChange={(value) => update('netIncome', value)}
        value={values.netIncome}
      />

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
      <p className="local-only-note form-wide" id="income-local-note">
        {copy.t('privacy.localOnly')}
      </p>
      <SegmentedField
        error={errors.currency}
        label={copy.t('form.currencyLabel')}
        name="currency"
        onChange={update}
        options={currencyOptions.map((currency) => ({ label: currency, value: currency }))}
        value={values.currency}
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
      {editMode && (
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
          <SegmentedField
            error={errors.theme}
            label={copy.t('form.themeLabel')}
            name="theme"
            onChange={update}
            options={themePreferences.map((theme) => ({ label: copy.theme(theme), value: theme }))}
            value={values.theme}
          />
        </>
      )}

      <div className="form-actions form-wide">
        {editMode && (
          <button className="button button-quiet" onClick={props.onCancel} type="button">
            {copy.t('form.cancel')}
          </button>
        )}
        <button className="button button-primary" type="submit">
          {editMode ? copy.t('form.save') : copy.t('form.start')}
        </button>
      </div>
    </form>
  );
}
