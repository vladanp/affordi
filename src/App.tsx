import { useEffect, useRef, useState } from 'react';

import { Calculator } from './components/Calculator';
import { IncomeForm } from './components/IncomeForm';
import { SettingsDialog } from './components/SettingsDialog';
import { UpdatePrompt } from './components/UpdatePrompt';
import { createTranslator, detectLocale } from './domain/i18n';
import { clearSettings, loadSettings, saveSettings, type AffordiSettings } from './domain/storage';
import { applyTheme } from './domain/theme';

export function App() {
  const [settings, setSettings] = useState<AffordiSettings | null>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [storageNotice, setStorageNotice] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const language = settings?.language ?? detectLocale();
  const theme = settings?.theme ?? 'system';
  const copy = createTranslator(language);

  useEffect(() => {
    document.documentElement.lang = language;
    applyTheme(theme);
  }, [language, theme]);

  function persist(nextSettings: AffordiSettings) {
    setSettings(nextSettings);
    setStorageNotice(!saveSettings(nextSettings));
  }

  function closeSettings() {
    setShowSettings(false);
    settingsButtonRef.current?.focus();
  }

  function reset(): boolean {
    if (!clearSettings()) {
      setStorageNotice(true);
      return false;
    }

    setSettings(null);
    setShowSettings(false);
    setStorageNotice(false);
    return true;
  }

  if (settings === null) {
    return (
      <main className="app-shell setup-shell">
        <div className="setup-intro">
          <p className="eyebrow">Affordi</p>
          <h1>{copy.t('app.tagline')}</h1>
          <p className="lede">{copy.t('app.settingsStay')}</p>
        </div>
        <IncomeForm onSubmit={persist} />
        {storageNotice && (
          <p className="storage-notice" role="status">
            {copy.t('storage.visitOnly')}
          </p>
        )}
        <UpdatePrompt language={language} />
      </main>
    );
  }

  return (
    <main className="app-shell calculator-shell">
      <Calculator
        onOpenSettings={() => setShowSettings(true)}
        settings={settings}
        settingsButtonRef={settingsButtonRef}
      />
      {storageNotice && (
        <p className="storage-notice" role="status">
          {copy.t('storage.couldNotSave')}
        </p>
      )}
      {showSettings && (
        <SettingsDialog
          onClose={closeSettings}
          onReset={reset}
          onSave={(nextSettings) => {
            persist(nextSettings);
            closeSettings();
          }}
          settings={settings}
        />
      )}
      <UpdatePrompt language={language} />
    </main>
  );
}
