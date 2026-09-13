import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';
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
  const copy = createTranslator(language);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (resetConfirmOpen) {
      event.preventDefault();
      setResetConfirmOpen(false);
      setResetError(false);
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
      ref={(node) => {
        if (node !== null && !node.open) {
          if (typeof node.showModal === 'function') node.showModal();
          else node.setAttribute('open', '');
        }
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-header">
          {resetConfirmOpen ? (
            <p className="eyebrow">Affordi</p>
          ) : (
            <h2 id="settings-title">{copy.t('settings.title')}</h2>
          )}
          <button
            aria-label={copy.t('settings.close')}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </div>
        {resetConfirmOpen ? (
          <div className="reset-view">
            <h2 id="settings-title">{copy.t('settings.resetTitle')}</h2>
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
                onClick={() => {
                  setResetConfirmOpen(false);
                  setResetError(false);
                }}
                type="button"
              >
                {copy.t('settings.keep')}
              </button>
              <button className="button reset-confirm-button" onClick={handleReset} type="button">
                {copy.t('settings.reset')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <IncomeForm
              initialValues={settings}
              mode="edit"
              onCancel={onClose}
              onLanguagePreview={onLanguagePreview}
              onSubmit={onSave}
              onThemePreview={onThemePreview}
            />
            <button
              className="reset-button"
              onClick={() => {
                setResetError(false);
                setResetConfirmOpen(true);
              }}
              type="button"
            >
              {copy.t('settings.resetSaved')}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
