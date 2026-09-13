import { useRegisterSW } from 'virtual:pwa-register/react';

import { createTranslator, type Locale } from '../domain/i18n';

interface UpdatePromptViewProps {
  needRefresh: boolean;
  language: Locale;
  onDismiss: () => void;
  onUpdate: () => void;
}

export function UpdatePromptView({
  needRefresh,
  language,
  onDismiss,
  onUpdate,
}: UpdatePromptViewProps) {
  if (!needRefresh) return null;
  const copy = createTranslator(language);

  return (
    <aside className="update-prompt">
      <div aria-live="polite" role="status">
        <strong>{copy.t('update.newReady')}</strong>
        <p>{copy.t('update.latest')}</p>
      </div>
      <button className="button button-primary" onClick={onUpdate} type="button">
        {copy.t('update.update')}
      </button>
      <button
        aria-label={copy.t('update.dismiss')}
        className="text-button"
        onClick={onDismiss}
        type="button"
      >
        {copy.t('update.dismiss')}
      </button>
    </aside>
  );
}

export function UpdatePrompt({ language }: { language: Locale }) {
  const registration = useRegisterSW();
  const [needRefresh, setNeedRefresh] = registration.needRefresh;

  return (
    <UpdatePromptView
      needRefresh={needRefresh}
      language={language}
      onDismiss={() => setNeedRefresh(false)}
      onUpdate={() => void registration.updateServiceWorker(true)}
    />
  );
}
