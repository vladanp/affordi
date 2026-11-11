import type { TranslationKey, Translator } from '../domain/i18n';
import { weekdays, type Weekday } from '../domain/schedule';
import { FieldError } from './FieldError';

export interface ScheduleValues {
  workStart: string;
  workEnd: string;
  workDays: readonly Weekday[];
  workBreak: string;
  customHours: boolean;
  dayHours: Record<number, { workStart: string; workEnd: string; workBreak: string }>;
}

export type ScheduleErrors = Partial<Record<keyof ScheduleValues, TranslationKey>>;

interface TimeFieldProps {
  error: string | undefined;
  label: string;
  name: 'workStart' | 'workEnd';
  id?: string;
  onChange: (name: 'workStart' | 'workEnd', value: string) => void;
  value: string;
}

function TimeField({ error, label, name, id = name, onChange, value }: TimeFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== undefined}
        id={id}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type="time"
        value={value}
      />
      <FieldError error={error} id={errorId} />
    </div>
  );
}

interface DayPickerProps {
  copy: Translator;
  error: string | undefined;
  onChange: (days: Weekday[]) => void;
  value: readonly Weekday[];
}

/** Checkboxes styled as chips, Monday first, because a week can have any set of work days. */
function DayPicker({ copy, error, onChange, value }: DayPickerProps) {
  const selected = new Set(value);

  function toggle(day: Weekday) {
    onChange(
      selected.has(day)
        ? value.filter((selectedDay) => selectedDay !== day)
        : [...value, day].toSorted((first, second) => first - second),
    );
  }

  return (
    <fieldset
      aria-describedby={error ? 'workDays-error' : undefined}
      className="field form-wide"
      data-field="workDays"
    >
      <legend className="field-label">{copy.t('form.workDaysLabel')}</legend>
      <span className="day-picker">
        {weekdays.map((day) => (
          <label className="day-chip" key={day}>
            <input
              aria-label={copy.weekday(day, 'long')}
              checked={selected.has(day)}
              name="workDays"
              onChange={() => toggle(day)}
              type="checkbox"
              value={day}
            />
            <span aria-hidden="true">{copy.weekday(day, 'short')}</span>
          </label>
        ))}
      </span>
      <FieldError error={error} id="workDays-error" />
    </fieldset>
  );
}

interface WorkScheduleFieldsProps {
  copy: Translator;
  errors: ScheduleErrors;
  onTimeChange: (name: 'workStart' | 'workEnd' | 'workBreak', value: string) => void;
  onCustomChange: (custom: boolean) => void;
  onDayChange: (
    day: Weekday,
    hours: { workStart: string; workEnd: string; workBreak: string },
  ) => void;
  onWorkDaysChange: (days: Weekday[]) => void;
  values: ScheduleValues;
}

/** Start and end times with the work days. Weekly hours follow from them. */
export function WorkScheduleFields({
  copy,
  errors,
  onTimeChange,
  onCustomChange,
  onDayChange,
  onWorkDaysChange,
  values,
}: WorkScheduleFieldsProps) {
  const selectedDays = new Set(values.workDays);
  return (
    <>
      {!values.customHours && (
        <>
          <div className="time-range form-wide">
            <TimeField
              error={errors.workStart === undefined ? undefined : copy.t(errors.workStart)}
              label={copy.t('form.workStartLabel')}
              name="workStart"
              onChange={onTimeChange}
              value={values.workStart}
            />
            <TimeField
              error={errors.workEnd === undefined ? undefined : copy.t(errors.workEnd)}
              label={copy.t('form.workEndLabel')}
              name="workEnd"
              onChange={onTimeChange}
              value={values.workEnd}
            />
          </div>
          <label className="field form-wide">
            <span className="field-label">{copy.t('form.workBreak')}</span>
            <input
              type="number"
              min="0"
              max="1439"
              step="1"
              name="workBreak"
              value={values.workBreak}
              onChange={(event) => onTimeChange('workBreak', event.target.value)}
            />
          </label>
        </>
      )}
      <label className="option-toggle form-wide">
        <input
          type="checkbox"
          checked={values.customHours}
          onChange={(event) => onCustomChange(event.target.checked)}
        />
        {copy.t('form.customHours')}
      </label>
      <DayPicker
        copy={copy}
        error={errors.workDays === undefined ? undefined : copy.t(errors.workDays)}
        onChange={onWorkDaysChange}
        value={values.workDays}
      />
      {values.customHours && (
        <div className="day-schedules form-wide" data-schedule>
          {weekdays
            .filter((day) => selectedDays.has(day))
            .map((day) => {
              const hours = values.dayHours[day]!;
              return (
                <fieldset className="field" key={day}>
                  <legend className="field-label">{copy.weekday(day, 'long')}</legend>
                  <div className="time-range">
                    <TimeField
                      name="workStart"
                      id={`workStart-${day}`}
                      label={copy.t('form.workStartLabel')}
                      value={hours.workStart}
                      error={undefined}
                      onChange={(name, value) => onDayChange(day, { ...hours, [name]: value })}
                    />
                    <TimeField
                      name="workEnd"
                      id={`workEnd-${day}`}
                      label={copy.t('form.workEndLabel')}
                      value={hours.workEnd}
                      error={undefined}
                      onChange={(name, value) => onDayChange(day, { ...hours, [name]: value })}
                    />
                  </div>
                  <label className="field">
                    <span className="field-label">{copy.t('form.workBreak')}</span>
                    <input
                      name="workBreak"
                      type="number"
                      min="0"
                      max="1439"
                      step="1"
                      value={hours.workBreak}
                      onChange={(event) =>
                        onDayChange(day, { ...hours, workBreak: event.target.value })
                      }
                    />
                  </label>
                </fieldset>
              );
            })}
        </div>
      )}
    </>
  );
}
