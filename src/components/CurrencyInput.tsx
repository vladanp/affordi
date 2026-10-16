import type { Translator } from '../domain/i18n';
import { getCurrencySymbol, isCurrencyCode } from '../domain/locale';

interface CurrencyInputProps {
  copy: Translator;
  currency: string;
  describedBy: string;
  id: string;
  invalid: boolean;
  /** The id of the visible label, which sits outside this component. */
  labelId: string;
  onChange: (value: string) => void;
  value: string;
}

/** A decimal amount field with the currency symbol in front. */
export function CurrencyInput({
  copy,
  currency,
  describedBy,
  id,
  invalid,
  labelId,
  onChange,
  value,
}: CurrencyInputProps) {
  return (
    <span className="input-with-prefix">
      <span aria-hidden="true" className="input-prefix">
        {isCurrencyCode(currency) ? getCurrencySymbol(currency, copy.locale) : currency}
      </span>
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid}
        aria-labelledby={labelId}
        autoComplete="off"
        enterKeyHint="done"
        id={id}
        inputMode="decimal"
        name={id}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        type="text"
        value={value}
      />
    </span>
  );
}
