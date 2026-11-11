import {
  Activity,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { Settings2 } from 'lucide-react';

import { DataDialog } from './components/DataDialog';
import { Brand } from './components/Brand';
import { Calculator } from './components/Calculator';
import { Earnings } from './components/Earnings';
import { IncomeForm } from './components/IncomeForm';
import { Monthly } from './components/Monthly';
import { PageNav } from './components/PageNav';
import { pageNames, usePage, usePageMotion } from './components/pages';
import { SettingsDialog } from './components/SettingsDialog';
import { UpdatePrompt } from './components/UpdatePrompt';
import { loadBills, mergeBill, saveBills, type Bill } from './domain/bills';
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
import {
  clearSettings,
  loadSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  type AffordiSettings,
} from './domain/storage';
import { mergeChanges, mergeList, withStorageLock } from './domain/storageSync';
import { applyTheme } from './domain/theme';

const APP_NAME = 'Affordi';

interface PageShellProps {
  bills: readonly Bill[];
  fixedCosts: readonly FixedCost[];
  onBillsChange: (bills: Bill[]) => void | Promise<void>;
  onFixedCostsChange: (fixedCosts: FixedCost[]) => void | Promise<void>;
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
  const motion = usePageMotion(page);
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
    <div className="page" data-page={page} data-motion={motion ?? undefined}>
      <header className="topbar">
        <Brand />
        <PageNav copy={copy} page={page} />
        <button
          aria-label={copy.t('calculator.settings')}
          className="pill-button round-button settings-button"
          onClick={onOpenSettings}
          ref={settingsButtonRef}
          title={copy.t('calculator.settings')}
          type="button"
        >
          <Settings2 aria-hidden="true" size={18} strokeWidth={2} />
        </button>
      </header>
      <Activity mode={page === 'cost' ? 'visible' : 'hidden'}>
        <Calculator settings={settings} bills={bills} fixedCosts={fixedCosts} />
      </Activity>
      <Activity mode={page === 'earnings' ? 'visible' : 'hidden'}>
        <Earnings
          bills={bills}
          fixedCosts={fixedCosts}
          onHideAmountsChange={onHideAmountsChange}
          settings={settings}
        />
      </Activity>
      <Activity mode={page === 'monthly' ? 'visible' : 'hidden'}>
        <Monthly
          bills={bills}
          fixedCosts={fixedCosts}
          onBillsChange={onBillsChange}
          onFixedCostsChange={onFixedCostsChange}
          onHideAmountsChange={onHideAmountsChange}
          settings={settings}
        />
      </Activity>
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
function useSavedList<T extends { id: string }>(
  load: () => T[],
  save: (items: readonly T[]) => boolean,
  storedSettings: RefObject<AffordiSettings | null>,
  merge?: (base: T, next: T, latest: T) => T,
) {
  const [items, setItems] = useState<T[]>(load);
  const confirmed = useRef(items);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      const latest = load();
      const base = confirmed.current;
      confirmed.current = latest;
      if (event.key === null || (storedSettings.current !== null && loadSettings() === null)) {
        setItems(latest);
        setSaveFailed(false);
      } else setItems((current) => mergeList(base, current, latest, merge));
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [load, merge, storedSettings]);

  function persist(nextItems: T[]) {
    const base = saveFailed ? confirmed.current : items;
    const hadStoredSettings = storedSettings.current !== null;
    setItems(nextItems);
    return withStorageLock(() => {
      const next =
        hadStoredSettings && loadSettings() === null
          ? []
          : mergeList(base, nextItems, load(), merge);
      const saved = save(next);
      setSaveFailed(!saved);
      if (saved) confirmed.current = next;
      setItems(saved ? next : nextItems);
    });
  }

  /** Forgets the list after a reset has already erased it from the device. */
  function forget() {
    confirmed.current = [];
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

function shouldRefreshSettings(event: StorageEvent, editing: boolean): boolean {
  if (event.key !== null && event.key !== SETTINGS_STORAGE_KEY) return false;
  return event.key === null || !editing || loadSettings() === null;
}

function rebaseSettings(
  base: AffordiSettings | null,
  next: AffordiSettings,
  latest = loadSettings(),
): AffordiSettings | null {
  if (base !== null && latest === null) return null;
  return base === null || latest === null ? next : mergeChanges(base, next, latest);
}

/** The complete settings transaction, called while holding the cross-tab storage lock. */
function saveRebasedSettings(base: AffordiSettings | null, nextSettings: AffordiSettings) {
  const next = rebaseSettings(base, nextSettings);
  return { next, saved: next !== null && saveSettings(next) };
}

/** Cancel drops form edits while retaining visit-only values and fresh changes from other tabs. */
function loadRebasedSettings(base: AffordiSettings | null, session: AffordiSettings | null) {
  const latest = loadSettings();
  return { latest, current: session === null ? latest : rebaseSettings(base, session, latest) };
}

/** Owns the saved snapshot separately from values retained for this visit after a failed write. */
function useSettingsStorage() {
  const [settings, setSettings] = useState<AffordiSettings | null>(() => loadSettings());
  const storedSettings = useRef(settings);
  const [storageNotice, setStorageNotice] = useState(false);

  function persist(nextSettings: AffordiSettings, onComplete?: () => void) {
    const base = storedSettings.current;
    void withStorageLock(() => {
      const { next, saved } = saveRebasedSettings(base, nextSettings);
      setStorageNotice(next !== null && !saved);
      if (saved || next === null) storedSettings.current = next;
      setSettings(next);
      onComplete?.();
    });
  }

  function reloadForCancel() {
    const { latest, current } = loadRebasedSettings(storedSettings.current, settings);
    setSettings(current);
    storedSettings.current = latest;
  }

  function forgetSettings() {
    setSettings(null);
    storedSettings.current = null;
    setStorageNotice(false);
  }

  return {
    settings,
    storedSettings,
    storageNotice,
    setStorageNotice,
    setSettings,
    persist,
    reloadForCancel,
    forgetSettings,
  };
}

function useAppState() {
  const {
    settings,
    storedSettings,
    storageNotice,
    setStorageNotice,
    setSettings,
    persist,
    reloadForCancel,
    forgetSettings,
  } = useSettingsStorage();
  const fixedCosts = useSavedList(loadFixedCosts, saveFixedCosts, storedSettings);
  const bills = useSavedList(loadBills, saveBills, storedSettings, mergeBill);
  const [showData, setShowData] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (!shouldRefreshSettings(event, showSettings)) return;
      const latest = loadSettings();
      storedSettings.current = latest;
      setSettings(latest);
      setShowSettings(false);
      setPreviewLanguage(null);
      setPreviewTheme(null);
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [showSettings, setSettings, storedSettings]);

  function dismissSettings() {
    setPreviewLanguage(null);
    setPreviewTheme(null);
    restoreSettingsFocusRef.current = true;
    setShowSettings(false);
  }

  function closeSettings() {
    reloadForCancel();
    dismissSettings();
  }

  function saveAndCloseSettings(nextSettings: AffordiSettings) {
    persist(nextSettings, dismissSettings);
  }

  function reset(): boolean {
    if (!clearSettings()) {
      setStorageNotice(true);
      return false;
    }

    setPreviewLanguage(null);
    setPreviewTheme(null);
    forgetSettings();
    fixedCosts.forget();
    bills.forget();
    setShowSettings(false);
    return true;
  }

  return {
    settings,
    fixedCosts,
    bills,
    showSettings,
    showData,
    setShowData,
    setShowSettings,
    storageNotice,
    setPreviewLanguage,
    setPreviewTheme,
    settingsButtonRef,
    language,
    copy,
    persist,
    closeSettings,
    saveAndCloseSettings,
    reset,
  };
}

export function App() {
  const {
    settings,
    fixedCosts,
    bills,
    showSettings,
    showData,
    setShowData,
    setShowSettings,
    storageNotice,
    setPreviewLanguage,
    setPreviewTheme,
    settingsButtonRef,
    language,
    copy,
    persist,
    closeSettings,
    saveAndCloseSettings,
    reset,
  } = useAppState();
  return (
    <>
      {settings === null ? (
        <main className="app-shell setup-shell">
          <div className="setup-intro">
            <div className="setup-topbar">
              <Brand />
              <button className="pill-button" type="button" onClick={() => setShowData(true)}>
                {copy.t('data.title')}
              </button>
            </div>
            <h1>{copy.t('form.heading')}</h1>
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
              onOpenData={() => setShowData(true)}
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
      {showData && <DataDialog copy={copy} onClose={() => setShowData(false)} />}
      <UpdatePrompt language={language} />
    </>
  );
}
