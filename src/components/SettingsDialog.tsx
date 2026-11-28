import { useEffect, useRef, useState } from 'react';

import { createTranslator, type Locale } from '../domain/i18n';
import type { AffordiSettings } from '../domain/storage';
import type { ThemePreference } from '../domain/theme';
import { IncomeForm } from './IncomeForm';
import { ConfirmView, SheetDialog } from './SheetDialog';

interface SettingsDialogProps {
  language: Locale;
  settings: AffordiSettings;
  onClose: () => void;
  onOpenData: (opener: HTMLElement) => void;
  onLanguagePreview: (language: Locale) => void;
  onReset: () => boolean | Promise<boolean>;
  onSave: (settings: AffordiSettings) => void;
  onThemePreview: (theme: ThemePreference) => void;
}

type ConfirmState =
  | { kind: 'reset'; error: boolean }
  | { kind: 'currency'; settings: AffordiSettings }
  | null;

interface SettingsConfirmProps {
  confirm: Exclude<ConfirmState, null>;
  copy: ReturnType<typeof createTranslator>;
  currentCurrency: AffordiSettings['currency'];
  onCancel: () => void;
  onConfirmCurrency: (next: AffordiSettings) => void;
  onConfirmReset: () => void;
}

function SettingsConfirm({
  confirm,
  copy,
  currentCurrency,
  onCancel,
  onConfirmCurrency,
  onConfirmReset,
}: SettingsConfirmProps) {
  if (confirm.kind === 'reset') {
    return (
      <ConfirmView
        cancelLabel={copy.t('settings.keep')}
        confirmLabel={copy.t('settings.reset')}
        confirmVariant="danger"
        description={copy.t('settings.resetDescription')}
        {...(confirm.error ? { error: copy.t('settings.resetFailure') } : {})}
        onCancel={onCancel}
        onConfirm={onConfirmReset}
      />
    );
  }
  return (
    <ConfirmView
      cancelLabel={copy.t('form.cancel')}
      confirmLabel={copy.t('currency.change')}
      confirmVariant="primary"
      description={copy.t('currency.description', {
        from: currentCurrency,
        to: confirm.settings.currency,
      })}
      onCancel={onCancel}
      onConfirm={() => onConfirmCurrency(confirm.settings)}
    />
  );
}

function dialogTitle(confirm: ConfirmState, copy: ReturnType<typeof createTranslator>) {
  if (confirm === null) return copy.t('settings.title');
  return confirm.kind === 'reset' ? copy.t('settings.resetTitle') : copy.t('currency.change');
}

export function SettingsDialog({
  language,
  settings,
  onClose,
  onOpenData,
  onLanguagePreview,
  onReset,
  onSave,
  onThemePreview,
}: SettingsDialogProps) {
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const restoreResetFocusRef = useRef(false);
  const copy = createTranslator(language);

  useEffect(() => {
    if (confirm !== null || !restoreResetFocusRef.current) return;
    restoreResetFocusRef.current = false;
    resetButtonRef.current?.focus();
  }, [confirm]);

  function dismissConfirm() {
    if (confirm?.kind === 'reset') restoreResetFocusRef.current = true;
    setConfirm(null);
  }

  function handleReset() {
    const result = onReset();
    if (result === false) setConfirm({ kind: 'reset', error: true });
    else if (result instanceof Promise) {
      void result.then((ok) => {
        if (!ok) setConfirm({ kind: 'reset', error: true });
      });
    }
  }

  function handleFormSubmit(nextSettings: AffordiSettings) {
    if (nextSettings.currency !== settings.currency) {
      setConfirm({ kind: 'currency', settings: nextSettings });
      return;
    }
    onSave(nextSettings);
  }

  return (
    <SheetDialog
      className="settings-dialog"
      closeLabel={copy.t('settings.close')}
      onBack={confirm === null ? null : dismissConfirm}
      onClose={onClose}
      title={dialogTitle(confirm, copy)}
      titleId="settings-title"
    >
      {confirm !== null && (
        <SettingsConfirm
          confirm={confirm}
          copy={copy}
          currentCurrency={settings.currency}
          onCancel={dismissConfirm}
          onConfirmCurrency={onSave}
          onConfirmReset={handleReset}
        />
      )}
      <IncomeForm
        hidden={confirm !== null}
        initialValues={settings}
        mode="edit"
        onCancel={onClose}
        onLanguagePreview={onLanguagePreview}
        onSubmit={handleFormSubmit}
        onThemePreview={onThemePreview}
      >
        <button
          className="text-button form-wide"
          onClick={(event) => onOpenData(event.currentTarget)}
          type="button"
        >
          {copy.t('data.title')}
        </button>
        <button
          className="text-button danger-button form-wide"
          onClick={() => setConfirm({ kind: 'reset', error: false })}
          ref={resetButtonRef}
          type="button"
        >
          {copy.t('settings.resetSaved')}
        </button>
      </IncomeForm>
    </SheetDialog>
  );
}
