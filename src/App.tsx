import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Brand } from './components/Brand';
import { Calculator } from './components/Calculator';
import { IncomeForm } from './components/IncomeForm';
import { SettingsDialog } from './components/SettingsDialog';
import { UpdatePrompt } from './components/UpdatePrompt';
import { clearChecks } from './domain/checks';
import { createTranslator, detectLocale, type Locale } from './domain/i18n';
import { clearSettings, loadSettings, saveSettings, type AffordiSettings } from './domain/storage';
import { applyTheme } from './domain/theme';

export function App() {
  const [settings, setSettings] = useState<AffordiSettings | null>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [storageNotice, setStorageNotice] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<Locale | null>(null);
  const [previewTheme, setPreviewTheme] = useState<AffordiSettings['theme'] | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSettingsFocusRef = useRef(false);
  const language = previewLanguage ?? settings?.language ?? detectLocale();
  const theme = previewTheme ?? settings?.theme ?? 'system';
  const copy = createTranslator(language);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    applyTheme(theme);
  }, [language, theme]);

  useEffect(() => {
    if (showSettings || !restoreSettingsFocusRef.current) return;
    restoreSettingsFocusRef.current = false;
    settingsButtonRef.current?.focus();
  }, [showSettings]);

  function persist(nextSettings: AffordiSettings) {
    setSettings(nextSettings);
    setStorageNotice(!saveSettings(nextSettings));
  }

  function closeSettings() {
    setPreviewLanguage(null);
    setPreviewTheme(null);
    restoreSettingsFocusRef.current = true;
    setShowSettings(false);
  }

  function saveAndCloseSettings(nextSettings: AffordiSettings) {
    persist(nextSettings);
    closeSettings();
  }

  function reset(): boolean {
    if (!clearChecks() || !clearSettings()) {
      setStorageNotice(true);
      return false;
    }

    setPreviewLanguage(null);
    setPreviewTheme(null);
    setSettings(null);
    setShowSettings(false);
    setStorageNotice(false);
    return true;
  }

  return (
    <>
      {settings === null ? (
        <main className="app-shell setup-shell">
          <div className="setup-intro">
            <Brand />
            <h1>{copy.t('app.tagline')}</h1>
          </div>
          <div className="setup-panel">
            <IncomeForm onSubmit={persist} />
            {storageNotice && (
              <p className="storage-notice" role="status">
                {copy.t('storage.visitOnly')}
              </p>
            )}
          </div>
        </main>
      ) : (
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
              language={language}
              onLanguagePreview={setPreviewLanguage}
              onReset={reset}
              onSave={saveAndCloseSettings}
              onThemePreview={setPreviewTheme}
              settings={settings}
            />
          )}
        </main>
      )}
      <UpdatePrompt language={language} />
    </>
  );
}
