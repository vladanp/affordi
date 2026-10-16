import { CurrencyInput } from './CurrencyInput';
import { isValidIncomeSettings, trueWageReduction, type WorkCosts } from '../domain/calculations';
import type { Translator } from '../domain/i18n';
import { formatIncomePercentage } from '../domain/priceText';
import { parseOptionalAmount, type ParsedWorkCosts } from '../domain/workCosts';

type WorkCostName = keyof WorkCosts;

/** The preview sentence, or null while the fields are empty or not valid yet. */
function describeReduction(income: unknown, costs: ParsedWorkCosts, copy: Translator) {
  const { commuteMinutes, monthlyWorkCosts } = costs;
  if (commuteMinutes === null || monthlyWorkCosts === null) return null;
  if (!isValidIncomeSettings(income)) return null;
  const reduction = trueWageReduction(income, { commuteMinutes, monthlyWorkCosts });
  if (reduction === null || reduction <= 0) return null;
  return copy.t('form.trueWagePreview', {
    percentage: formatIncomePercentage(reduction, copy.locale),
  });
}

interface TrueWageFieldsProps {
  copy: Translator;
  currency: string;
  errors: Record<WorkCostName, string | undefined>;
  income: unknown;
  onChange: (name: WorkCostName, value: string) => void;
  values: Record<WorkCostName, string>;
}

/** Optional commute time and work costs that turn the paid wage into the true one. */
export function TrueWageFields({
  copy,
  currency,
  errors,
  income,
  onChange,
  values,
}: TrueWageFieldsProps) {
  const parsed = {
    commuteMinutes: parseOptionalAmount(values.commuteMinutes, copy.locale),
    monthlyWorkCosts: parseOptionalAmount(values.monthlyWorkCosts, copy.locale),
  };
  const preview = describeReduction(income, parsed, copy);
  const commuteDescribedBy = errors.commuteMinutes
    ? 'true-wage-hint commute-error'
    : 'true-wage-hint';
  const costsDescribedBy = `true-wage-hint work-costs-currency-description${
    errors.monthlyWorkCosts ? ' work-costs-error' : ''
  }`;

  return (
    <fieldset className="field form-wide true-wage">
      <legend className="field-label">{copy.t('form.trueWageTitle')}</legend>
      <small className="field-hint" id="true-wage-hint">
        {copy.t('form.trueWageHint')}
      </small>
      <div className="true-wage-fields">
        <div className="field">
          <label className="field-label" htmlFor="commuteMinutes">
            {copy.t('form.commuteLabel')}
          </label>
          <input
            aria-describedby={commuteDescribedBy}
            aria-invalid={errors.commuteMinutes !== undefined}
            autoComplete="off"
            id="commuteMinutes"
            inputMode="numeric"
            name="commuteMinutes"
            onChange={(event) => onChange('commuteMinutes', event.target.value)}
            type="text"
            value={values.commuteMinutes}
          />
          {errors.commuteMinutes !== undefined && (
            <small className="field-error" id="commute-error">
              {errors.commuteMinutes}
            </small>
          )}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="monthlyWorkCosts" id="monthlyWorkCosts-label">
            {copy.t('form.workCostsLabel')}
          </label>
          <CurrencyInput
            copy={copy}
            currency={currency}
            describedBy={costsDescribedBy}
            id="monthlyWorkCosts"
            invalid={errors.monthlyWorkCosts !== undefined}
            labelId="monthlyWorkCosts-label"
            onChange={(value) => onChange('monthlyWorkCosts', value)}
            value={values.monthlyWorkCosts}
          />
          <small className="visually-hidden" id="work-costs-currency-description">
            {copy.t('form.savingsDescription', { currency })}
          </small>
          {errors.monthlyWorkCosts !== undefined && (
            <small className="field-error" id="work-costs-error">
              {errors.monthlyWorkCosts}
            </small>
          )}
        </div>
      </div>
      <p aria-live="polite" className="true-wage-preview">
        {preview}
      </p>
    </fieldset>
  );
}
