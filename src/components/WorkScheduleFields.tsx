import { formatHoursAndMinutes } from '../domain/duration';
import type { Translator } from '../domain/i18n';
import { parseTimeInput, weekdays, type Weekday } from '../domain/schedule';
import { FieldError } from './FieldError';

export interface ScheduleValues {
  workStart: string;
  workEnd: string;
  workDays: readonly Weekday[];
}

export type ScheduleErrors = Partial<Record<keyof ScheduleValues, string>>;

interface TimeFieldProps {
  error: string | undefined;
  label: string;
  name: 'workStart' | 'workEnd';
  onChange: (name: 'workStart' | 'workEnd', value: string) => void;
  value: string;
}

function TimeField({ error, label, name, onChange, value }: TimeFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== undefined}
        id={name}
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

/** Daily and weekly working time for a complete schedule, or null while it is incomplete. */
function describeSchedule(values: ScheduleValues, copy: Translator): string | null {
  const start = parseTimeInput(values.workStart, 'start');
  const end = parseTimeInput(values.workEnd, 'end');
  if (start === null || end === null || end <= start || values.workDays.length === 0) return null;

  const dailyMinutes = end - start;
  return copy.t('form.scheduleSummary', {
    daily: formatHoursAndMinutes(dailyMinutes, copy),
    weekly: formatHoursAndMinutes(dailyMinutes * values.workDays.length, copy),
  });
}

interface WorkScheduleFieldsProps {
  copy: Translator;
  errors: ScheduleErrors;
  onTimeChange: (name: 'workStart' | 'workEnd', value: string) => void;
  onWorkDaysChange: (days: Weekday[]) => void;
  values: ScheduleValues;
}

/** Start and end times with the work days. Weekly hours follow from them. */
export function WorkScheduleFields({
  copy,
  errors,
  onTimeChange,
  onWorkDaysChange,
  values,
}: WorkScheduleFieldsProps) {
  const summary = describeSchedule(values, copy);
  return (
    <>
      <div className="time-range form-wide">
        <TimeField
          error={errors.workStart}
          label={copy.t('form.workStartLabel')}
          name="workStart"
          onChange={onTimeChange}
          value={values.workStart}
        />
        <TimeField
          error={errors.workEnd}
          label={copy.t('form.workEndLabel')}
          name="workEnd"
          onChange={onTimeChange}
          value={values.workEnd}
        />
      </div>
      <DayPicker
        copy={copy}
        error={errors.workDays}
        onChange={onWorkDaysChange}
        value={values.workDays}
      />
      {summary !== null && <p className="schedule-summary form-wide">{summary}</p>}
    </>
  );
}
