import {
  Activity,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { LockKeyhole, Settings2 } from 'lucide-react';

import { Brand } from './components/Brand';
import { Calculator } from './components/Calculator';
import { Earnings } from './components/Earnings';
import { Bills } from './components/Bills';
import { FixedCosts } from './components/FixedCosts';
import { IncomeForm } from './components/IncomeForm';
import { PageNav } from './components/PageNav';
import { pageNames, usePage } from './components/pages';
import { SettingsDialog } from './components/SettingsDialog';
import { UpdatePrompt } from './components/UpdatePrompt';
import { loadBills, saveBills, type Bill } from './domain/bills';
import { loadFixedCosts, saveFixedCosts, type FixedCost } from './domain/fixedCosts';
import {
  createTranslator,
  detectLocale,
  loadedLocaleCount,
  loadLocale,
  subscribeToLocales,
  type Locale,
  type TranslationKey,
  type Translator,
} from './domain/i18n';
import { clearSettings, loadSettings, saveSettings, type AffordiSettings } from './domain/storage';
import { applyTheme } from './domain/theme';

const APP_NAME = 'Affordi';

interface PageShellProps {
  bills: readonly Bill[];
  fixedCosts: readonly FixedCost[];
  onBillsChange: (bills: Bill[]) => void;
  onFixedCostsChange: (fixedCosts: FixedCost[]) => void;
  onHideAmountsChange: (hideAmounts: boolean) => void;
  onOpenSettings: () => void;
  settings: AffordiSettings;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
}

/**
 * The top bar and page navigation around every page. Hidden pages keep their
 * state, so a typed price survives a visit to earnings, and their timers stop.
 */
function PageShell({
  bills,
  fixedCosts,
  onBillsChange,
  onFixedCostsChange,
  onHideAmountsChange,
  onOpenSettings,
  settings,
  settingsButtonRef,
}: PageShellProps) {
  const page = usePage();
  const copy = createTranslator(settings.language);
  const title = page === 'cost' ? APP_NAME : `${copy.t(pageNames[page])} · ${APP_NAME}`;

  // Each page names itself in the tab, the history list, and to screen readers.
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);

  return (
    <div className="page">
      <header className="topbar">
        <Brand />
        <PageNav copy={copy} page={page} />
        <button
          aria-label={copy.t('calculator.settings')}
          className="pill-button settings-button"
          onClick={onOpenSettings}
          ref={settingsButtonRef}
          title={copy.t('calculator.settings')}
          type="button"
        >
          <Settings2 aria-hidden="true" size={18} strokeWidth={2} />
        </button>
      </header>
      <Activity mode={page === 'cost' ? 'visible' : 'hidden'}>
        <Calculator settings={settings} />
      </Activity>
      <Activity mode={page === 'earnings' ? 'visible' : 'hidden'}>
        <Earnings
          bills={bills}
          fixedCosts={fixedCosts}
          onHideAmountsChange={onHideAmountsChange}
          settings={settings}
        />
      </Activity>
      <Activity mode={page === 'fixed-costs' ? 'visible' : 'hidden'}>
        <FixedCosts
          fixedCosts={fixedCosts}
          onFixedCostsChange={onFixedCostsChange}
          onHideAmountsChange={onHideAmountsChange}
          settings={settings}
        />
      </Activity>
      <Activity mode={page === 'bills' ? 'visible' : 'hidden'}>
        <Bills
          bills={bills}
          fixedCosts={fixedCosts}
          onBillsChange={onBillsChange}
          onHideAmountsChange={onHideAmountsChange}
          settings={settings}
        />
      </Activity>
      <p className="local-only-footer">
        <LockKeyhole aria-hidden="true" size={14} strokeWidth={2} />
        <span>{copy.t('privacy.localOnly')}</span>
      </p>
    </div>
  );
}

interface StorageNoticeProps {
  copy: Translator;
  message: TranslationKey;
  visible: boolean;
}

/** Says when something could not be saved on this device. */
function StorageNotice({ copy, message, visible }: StorageNoticeProps) {
  if (!visible) return null;
  return (
    <p className="storage-notice" role="status">
      {copy.t(message)}
    </p>
  );
}

/** A saved list, such as fixed costs or bills, with whether the last change could be saved. */
function useSavedList<T>(load: () => T[], save: (items: readonly T[]) => boolean) {
  const [items, setItems] = useState<T[]>(load);
  const [saveFailed, setSaveFailed] = useState(false);

  function persist(nextItems: T[]) {
    setItems(nextItems);
    setSaveFailed(!save(nextItems));
  }

  /** Forgets the list after a reset has already erased it from the device. */
  function forget() {
    setItems([]);
    setSaveFailed(false);
  }

  return { forget, items, persist, saveFailed };
}

/**
 * The language the app shows: one being previewed, the saved one, or the browser's. It loads
 * the language's copy, and renders again once one chosen before it loaded arrives.
 */
function useLanguage(preview: Locale | null, saved: Locale | undefined): Locale {
  const language = preview ?? saved ?? detectLocale();
  useSyncExternalStore(subscribeToLocales, loadedLocaleCount, loadedLocaleCount);
  useEffect(() => {
    loadLocale(language).catch(() => undefined);
  }, [language]);
  return language;
}

export function App() {
  const [settings, setSettings] = useState<AffordiSettings | null>(() => loadSettings());
  const fixedCosts = useSavedList(loadFixedCosts, saveFixedCosts);
  const bills = useSavedList(loadBills, saveBills);
  const [showSettings, setShowSettings] = useState(false);
  const [storageNotice, setStorageNotice] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<Locale | null>(null);
  const [previewTheme, setPreviewTheme] = useState<AffordiSettings['theme'] | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSettingsFocusRef = useRef(false);
  const language = useLanguage(previewLanguage, settings?.language);
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
    if (!clearSettings()) {
      setStorageNotice(true);
      return false;
    }

    setPreviewLanguage(null);
    setPreviewTheme(null);
    setSettings(null);
    fixedCosts.forget();
    bills.forget();
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
            <StorageNotice copy={copy} message="storage.visitOnly" visible={storageNotice} />
          </div>
        </main>
      ) : (
        <main className="app-shell calculator-shell">
          <PageShell
            bills={bills.items}
            fixedCosts={fixedCosts.items}
            onBillsChange={bills.persist}
            onFixedCostsChange={fixedCosts.persist}
            onHideAmountsChange={(hideAmounts) => persist({ ...settings, hideAmounts })}
            onOpenSettings={() => setShowSettings(true)}
            settings={settings}
            settingsButtonRef={settingsButtonRef}
          />
          <StorageNotice copy={copy} message="storage.couldNotSave" visible={storageNotice} />
          <StorageNotice
            copy={copy}
            message="fixedCosts.couldNotSave"
            visible={fixedCosts.saveFailed}
          />
          <StorageNotice copy={copy} message="bills.couldNotSave" visible={bills.saveFailed} />
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
