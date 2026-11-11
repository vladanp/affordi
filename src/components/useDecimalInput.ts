import { useCallback, useState } from 'react';

import { translateDecimalInput, parseDecimalInput } from '../domain/input';

/** A draft keeps the locale it was typed in, even while another language is selected. */
export function useDecimalInput(
  initialValue: string,
  locale: string,
  minimumFractionDigits = 0,
  syncExternal = false,
) {
  const [draft, setDraft] = useState(() => ({ value: initialValue, locale }));
  const [snapshot, setSnapshot] = useState(initialValue);
  const setValue = useCallback((value: string) => setDraft({ value, locale }), [locale]);
  if (snapshot !== initialValue) {
    setSnapshot(initialValue);
    if (syncExternal) setDraft({ value: initialValue, locale });
  }
  return {
    value: translateDecimalInput(draft.value, draft.locale, locale, minimumFractionDigits),
    amount: parseDecimalInput(draft.value, draft.locale),
    setValue,
  };
}
