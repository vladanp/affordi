import { useRegisterSW } from 'virtual:pwa-register/react';

import { scheduleUpdateChecks } from './updateChecks';
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
    <aside aria-labelledby="update-title" className="update-prompt">
      <div aria-live="polite" role="status">
        <strong id="update-title">{copy.t('update.newReady')}</strong>
        <p>{copy.t('update.latest')}</p>
      </div>
      <button className="button button-primary" onClick={onUpdate} type="button">
        {copy.t('update.update')}
      </button>
      <button className="text-button" onClick={onDismiss} type="button">
        {copy.t('update.dismiss')}
      </button>
    </aside>
  );
}

export function UpdatePrompt({ language }: { language: Locale }) {
  const registration = useRegisterSW({ onRegisteredSW: scheduleUpdateChecks });
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
