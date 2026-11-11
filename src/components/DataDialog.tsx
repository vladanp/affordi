import { useRef, useState } from 'react';
import { createBackup, parseBackup, restoreBackup, type Backup } from '../domain/backup';
import type { Translator } from '../domain/i18n';
import { withStorageLock } from '../domain/storageSync';
import { SheetDialog } from './SheetDialog';

function download() {
  const backup = createBackup();
  if (backup === null) return;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `affordi-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DataDialog({ copy, onClose }: { copy: Translator; onClose: () => void }) {
  const [pending, setPending] = useState<Backup | null>(null);
  const [error, setError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const available = createBackup() !== null;

  async function readFile(file: File | undefined) {
    setError(false);
    if (file === undefined) return;
    if (file.size > 2_000_000) {
      setError(true);
      return;
    }
    try {
      const backup = parseBackup(await file.text());
      if (backup === null) setError(true);
      else setPending(backup);
    } catch {
      setError(true);
    }
  }

  function replace() {
    if (pending === null) return;
    withStorageLock(() => {
      if (!restoreBackup(pending)) {
        setError(true);
        return;
      }
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
      onClose();
    });
  }

  return (
    <SheetDialog
      closeLabel={copy.t('fixedCosts.close')}
      title={copy.t(pending === null ? 'data.title' : 'data.replaceTitle')}
      onClose={onClose}
      onBack={pending === null ? null : () => setPending(null)}
    >
      {pending === null ? (
        <>
          <p>{copy.t('data.privacy')}</p>
          <div className="form-actions">
            <button
              type="button"
              className="button button-quiet"
              disabled={!available}
              onClick={download}
            >
              {copy.t('data.export')}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => fileRef.current?.click()}
            >
              {copy.t('data.import')}
            </button>
          </div>
          <input
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            ref={fileRef}
            aria-label={copy.t('data.import')}
            onChange={(event) => {
              void readFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </>
      ) : (
        <>
          <p>
            {copy.t('data.replaceDescription', {
              bills: pending.bills.length,
              costs: pending.fixedCosts.length,
            })}
          </p>
          <div className="form-actions">
            <button type="button" className="button button-quiet" onClick={() => setPending(null)}>
              {copy.t('form.cancel')}
            </button>
            <button type="button" className="button button-danger" onClick={replace}>
              {copy.t('data.replace')}
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="status" className="field-error">
          {copy.t('data.failure')}
        </p>
      )}
    </SheetDialog>
  );
}
