import { useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { isPayFrequency, payFrequencies } from '../domain/calculations';
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
import { isWorkSchedule, parseTimeInput, timeInputValue, type Weekday } from '../domain/schedule';
import {
  defaultSettings,
  isValidAffordiSettings,
  withScheduleHours,
  type AffordiSettings,
} from '../domain/storage';
import { isThemePreference, themePreferences, type ThemePreference } from '../domain/theme';
import { FieldError } from './FieldError';
import { Segmented, type SegmentOption } from './Segmented';
import { WorkScheduleFields, type ScheduleErrors } from './WorkScheduleFields';

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
  workStart: string;
  workEnd: string;
  workDays: readonly Weekday[];
  currency: string;
  language: string;
  theme: string;
}

type TextValueName = Exclude<keyof FormValues, 'workDays'>;
type FormErrors = Partial<Record<keyof FormValues, string>>;
type UpdateField = (name: TextValueName, value: string) => void;

type FieldOption = SegmentOption<string>;

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
    workStart: timeInputValue(settings.workStart),
    workEnd: timeInputValue(settings.workEnd),
    workDays: settings.workDays,
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
  'workStart',
  'workEnd',
  'workDays',
  'language',
  'theme',
] as const satisfies readonly (keyof FormValues)[];

function scheduleErrors(
  workStart: number | null,
  workEnd: number | null,
  workDays: readonly Weekday[],
  copy: Translator,
): ScheduleErrors {
  const errors: ScheduleErrors = {};
  if (workStart === null) errors.workStart = copy.t('validation.workStart');
  if (workEnd === null || (workStart !== null && workEnd <= workStart)) {
    errors.workEnd = copy.t('validation.workEnd');
  }
  if (workDays.length === 0) errors.workDays = copy.t('validation.workDays');
  return errors;
}

function validate(
  values: FormValues,
  copy: Translator,
): { settings?: AffordiSettings; errors: FormErrors } {
  const netIncome = parseDecimalInput(values.netIncome, copy.locale);
  const schedule = {
    workStart: parseTimeInput(values.workStart, 'start'),
    workEnd: parseTimeInput(values.workEnd, 'end'),
    workDays: values.workDays,
  };
  const errors: FormErrors = scheduleErrors(
    schedule.workStart,
    schedule.workEnd,
    schedule.workDays,
    copy,
  );

  if (netIncome === null || netIncome <= 0) errors.netIncome = copy.t('validation.income');
  for (const field of choiceFields) {
    if (!field.isValid(values[field.name])) errors[field.name] = copy.t(field.message);
  }
  if (Object.keys(errors).length > 0 || !isWorkSchedule(schedule)) return { errors };

  const candidate = {
    netIncome,
    payFrequency: values.payFrequency,
    ...withScheduleHours(schedule),
    currency: values.currency,
    language: values.language,
    theme: values.theme,
  };
  if (!isValidAffordiSettings(candidate)) return { errors };
  return { errors, settings: candidate };
}

/** The first control of a field, since radio and checkbox groups share one name. */
function firstControl(form: HTMLFormElement, name: string): Element | null {
  const control = form.elements.namedItem(name);
  return control instanceof RadioNodeList ? (control.item(0) ?? null) : control;
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

  function update(name: TextValueName, value: string) {
    if (props.mode === 'edit' && name === 'theme' && isThemePreference(value)) {
      props.onThemePreview(value);
    }
    if (props.mode === 'edit' && name === 'language' && isLocale(value)) {
      props.onLanguagePreview(value);
    }
    setValues((current) => ({ ...current, [name]: value }));
    clearError(name);
  }

  function updateWorkDays(workDays: Weekday[]) {
    setValues((current) => ({ ...current, workDays }));
    clearError('workDays');
  }

  function clearError(name: keyof FormValues) {
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
    const firstInvalidControl = firstControl(event.currentTarget, firstInvalidName ?? '');
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
      <WorkScheduleFields
        copy={copy}
        errors={errors}
        onTimeChange={update}
        onWorkDaysChange={updateWorkDays}
        values={values}
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
