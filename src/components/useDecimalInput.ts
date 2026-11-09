import { useState } from 'react';

import { localizeDecimalInput, parseDecimalInput } from '../domain/input';

/** A draft keeps the locale it was typed in, even while another language is selected. */
export function useDecimalInput(initialValue: string, locale: string, minimumFractionDigits = 0) {
  const [draft, setDraft] = useState(() => ({ value: initialValue, locale }));
  return {
    value: localizeDecimalInput(draft.value, draft.locale, locale, minimumFractionDigits),
    amount: parseDecimalInput(draft.value, draft.locale),
    setValue: (value: string) => setDraft({ value, locale }),
  };
}
