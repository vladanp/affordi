import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';

import { IncomeForm } from './IncomeForm';
import { createTranslator } from '../domain/i18n';
import type { AffordiSettings } from '../domain/storage';

interface SettingsDialogProps {
  settings: AffordiSettings;
  onClose: () => void;
  onReset: () => boolean;
  onSave: (settings: AffordiSettings) => void;
}

export function SettingsDialog({ settings, onClose, onReset, onSave }: SettingsDialogProps) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetError, setResetError] = useState(false);
  const copy = createTranslator(settings.language);

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
        {resetConfirmOpen ? (
          <div className="reset-view">
            <div className="dialog-header">
              <p className="eyebrow">Affordi</p>
              <button
                aria-label={copy.t('settings.close')}
                className="icon-button"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            </div>
            <h2 id="settings-title">{copy.t('settings.resetTitle')}</h2>
            <p className="reset-copy">{copy.t('settings.resetDescription')}</p>
            {resetError && (
              <p className="field-error" role="status">
                {copy.t('settings.resetFailure')}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button button-quiet"
                onClick={() => {
                  setResetConfirmOpen(false);
                  setResetError(false);
                }}
                ref={(node) => node?.focus()}
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
            <div className="dialog-header">
              <h2 id="settings-title">{copy.t('settings.title')}</h2>
              <button
                aria-label={copy.t('settings.close')}
                className="icon-button"
                onClick={onClose}
                type="button"
              >
                ×
              </button>
            </div>
            <IncomeForm initialValues={settings} mode="edit" onCancel={onClose} onSubmit={onSave} />
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
