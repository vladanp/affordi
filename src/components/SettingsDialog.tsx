import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { X } from 'lucide-react';

import { IncomeForm } from './IncomeForm';
import { createTranslator, type Locale } from '../domain/i18n';
import type { AffordiSettings } from '../domain/storage';
import type { ThemePreference } from '../domain/theme';

interface SettingsDialogProps {
  language: Locale;
  settings: AffordiSettings;
  onClose: () => void;
  onLanguagePreview: (language: Locale) => void;
  onReset: () => boolean;
  onSave: (settings: AffordiSettings) => void;
  onThemePreview: (theme: ThemePreference) => void;
}

function openAsModal(node: HTMLDialogElement | null) {
  if (node === null || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}

export function SettingsDialog({
  language,
  settings,
  onClose,
  onLanguagePreview,
  onReset,
  onSave,
  onThemePreview,
}: SettingsDialogProps) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetError, setResetError] = useState(false);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const restoreResetFocusRef = useRef(false);
  const copy = createTranslator(language);

  useEffect(() => {
    if (resetConfirmOpen || !restoreResetFocusRef.current) return;
    restoreResetFocusRef.current = false;
    resetButtonRef.current?.focus();
  }, [resetConfirmOpen]);

  function keepSettings() {
    restoreResetFocusRef.current = true;
    setResetConfirmOpen(false);
    setResetError(false);
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (resetConfirmOpen) {
      event.preventDefault();
      keepSettings();
      return;
    }
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    handleCancel(event);
  }

  function handleReset() {
    if (!onReset()) setResetError(true);
  }

  return (
    <dialog
      aria-labelledby="settings-title"
      className="settings-dialog"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      ref={openAsModal}
    >
      <div className="dialog-inner">
        <div className="dialog-header">
          <h2 id="settings-title">
            {copy.t(resetConfirmOpen ? 'settings.resetTitle' : 'settings.title')}
          </h2>
          <button
            aria-label={copy.t('settings.close')}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
        {resetConfirmOpen && (
          <div className="reset-view">
            <p className="reset-copy">{copy.t('settings.resetDescription')}</p>
            {resetError && (
              <p className="field-error" role="status">
                {copy.t('settings.resetFailure')}
              </p>
            )}
            <div className="form-actions">
              <button
                autoFocus
                className="button button-quiet"
                onClick={keepSettings}
                type="button"
              >
                {copy.t('settings.keep')}
              </button>
              <button className="button button-danger" onClick={handleReset} type="button">
                {copy.t('settings.reset')}
              </button>
            </div>
          </div>
        )}
        <IncomeForm
          hidden={resetConfirmOpen}
          initialValues={settings}
          mode="edit"
          onCancel={onClose}
          onLanguagePreview={onLanguagePreview}
          onSubmit={onSave}
          onThemePreview={onThemePreview}
        />
        <button
          className="reset-button"
          hidden={resetConfirmOpen}
          onClick={() => {
            setResetError(false);
            setResetConfirmOpen(true);
          }}
          ref={resetButtonRef}
          type="button"
        >
          {copy.t('settings.resetSaved')}
        </button>
      </div>
    </dialog>
  );
}
