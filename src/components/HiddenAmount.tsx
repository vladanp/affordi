import { Eye, EyeOff } from 'lucide-react';

import type { Translator } from '../domain/i18n';

/** Dots in place of an amount, with a word for screen readers. */
export function HiddenAmount({ copy }: { copy: Translator }) {
  return (
    <>
      <span aria-hidden="true">••••</span>
      <span className="visually-hidden">{copy.t('earnings.hiddenAmount')}</span>
    </>
  );
}

interface HideAmountsButtonProps {
  copy: Translator;
  hidden: boolean;
  onChange: (hidden: boolean) => void;
}

/** Hides or shows every amount on the pages that list them, remembered on the device. */
export function HideAmountsButton({ copy, hidden, onChange }: HideAmountsButtonProps) {
  const label = copy.t(hidden ? 'earnings.showAmounts' : 'earnings.hideAmounts');
  return (
    <button
      aria-label={label}
      className="icon-button"
      onClick={() => onChange(!hidden)}
      title={label}
      type="button"
    >
      {hidden ? (
        <Eye aria-hidden="true" size={20} strokeWidth={1.75} />
      ) : (
        <EyeOff aria-hidden="true" size={20} strokeWidth={1.75} />
      )}
    </button>
  );
}
