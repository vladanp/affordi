import type { PayFrequency } from './calculations';
import type { ThemePreference } from './theme';

/** The languages currently available in the Affordi interface. */
export const supportedLocales = ['en', 'de', 'fr', 'it', 'sr'] as const;

export type Locale = (typeof supportedLocales)[number];

export type DurationUnit = 'minute' | 'hour' | 'workday' | 'day' | 'workweek';

export interface DurationPart {
  value: number;
  unit: DurationUnit;
}

/**
 * Keep copy keys in one place. Components can use `TranslationKey` to make
 * missing or misspelled copy keys a type error.
 */
export const translationKeys = [
  'app.tagline',
  'app.settingsStay',
  'storage.visitOnly',
  'storage.couldNotSave',
  'calculator.settings',
  'calculator.title',
  'calculator.priceLabel',
  'calculator.priceDescription',
  'calculator.priceError',
  'calculator.resultIs',
  'calculator.emptyResult',
  'calculator.payContext',
  'form.heading',
  'form.setupNote',
  'form.incomeLabel',
  'form.incomeDescription',
  'form.payFrequencyLabel',
  'form.weeklyHoursLabel',
  'form.workingDaysLabel',
  'form.currencyLabel',
  'form.languageLabel',
  'form.themeLabel',
  'form.cancel',
  'form.start',
  'form.save',
  'validation.income',
  'validation.payFrequency',
  'validation.weeklyHours',
  'validation.workingDays',
  'validation.currency',
  'validation.language',
  'validation.theme',
  'settings.title',
  'settings.close',
  'settings.resetTitle',
  'settings.resetDescription',
  'settings.resetFailure',
  'settings.keep',
  'settings.reset',
  'settings.resetSaved',
  'update.newReady',
  'update.latest',
  'update.update',
  'update.dismiss',
  'duration.lessThanMinute',
  'duration.moreThanWorkweeks',
  'duration.ofWork',
  'theme.system',
  'theme.light',
  'theme.dark',
] as const;

export type TranslationKey = (typeof translationKeys)[number];
type Catalog = Record<TranslationKey, string>;

const english: Catalog = {
  'app.tagline': 'See what things really cost in your time.',
  'app.settingsStay': 'Your settings stay on this device. You can change them anytime.',
  'storage.visitOnly': 'Saved for this visit. Your browser blocked local saving.',
  'storage.couldNotSave': 'Settings are available for this visit, but could not be saved.',
  'calculator.settings': 'Settings',
  'calculator.title': 'How much does it cost?',
  'calculator.priceLabel': 'Enter a price',
  'calculator.priceDescription': 'Price in {{currency}}.',
  'calculator.priceError': 'Enter a valid non-negative price using numbers, . or ,.',
  'calculator.resultIs': '{{price}} is',
  'calculator.emptyResult': 'Enter a price to see its time cost.',
  'calculator.payContext': '{{percentage}}% of your take-home pay ({{period}})',
  'form.heading': 'Start with your income',
  'form.setupNote': 'One quick setup.',
  'form.incomeLabel': 'Take-home income',
  'form.incomeDescription': 'Amount in {{currency}}, after tax.',
  'form.payFrequencyLabel': 'Pay frequency',
  'form.weeklyHoursLabel': 'Work hours each week',
  'form.workingDaysLabel': 'Work days each week',
  'form.currencyLabel': 'Currency',
  'form.languageLabel': 'Language',
  'form.themeLabel': 'Appearance',
  'form.cancel': 'Cancel',
  'form.start': 'Start calculating',
  'form.save': 'Save settings',
  'validation.income': 'Enter an income greater than 0.',
  'validation.payFrequency': 'Choose how often you are paid.',
  'validation.weeklyHours': 'Use between 1 and 168 hours each week.',
  'validation.workingDays': 'Use a whole number from 1 to 7.',
  'validation.currency': 'Choose a currency.',
  'validation.language': 'Choose a language.',
  'validation.theme': 'Choose an appearance.',
  'settings.title': 'Settings',
  'settings.close': 'Close settings',
  'settings.resetTitle': 'Reset settings?',
  'settings.resetDescription': 'This removes the income details saved on this device.',
  'settings.resetFailure': 'Could not clear saved settings. Nothing was changed.',
  'settings.keep': 'Keep settings',
  'settings.reset': 'Reset',
  'settings.resetSaved': 'Reset saved settings',
  'update.newReady': 'A new Affordi is ready.',
  'update.latest': 'Update now for the latest version.',
  'update.update': 'Update',
  'update.dismiss': 'Dismiss notification',
  'duration.lessThanMinute': 'Less than 1 minute',
  'duration.moreThanWorkweeks': 'More than {{count}} workweeks',
  'duration.ofWork': '{{duration}} of work',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
};

const german: Catalog = {
  'app.tagline': 'Sieh, was Dinge wirklich an Zeit kosten.',
  'app.settingsStay':
    'Deine Einstellungen bleiben auf diesem Gerät. Du kannst sie jederzeit ändern.',
  'storage.visitOnly':
    'Für diesen Besuch gespeichert. Dein Browser hat das lokale Speichern blockiert.',
  'storage.couldNotSave':
    'Die Einstellungen sind für diesen Besuch verfügbar, konnten aber nicht gespeichert werden.',
  'calculator.settings': 'Einstellungen',
  'calculator.title': 'Was kostet es an Zeit?',
  'calculator.priceLabel': 'Preis eingeben',
  'calculator.priceDescription': 'Preis in {{currency}}.',
  'calculator.priceError': 'Gib einen gültigen, nicht negativen Preis mit Zahlen, . oder , ein.',
  'calculator.resultIs': '{{price}} entspricht',
  'calculator.emptyResult': 'Gib einen Preis ein, um die Kosten in Zeit zu sehen.',
  'calculator.payContext': '{{percentage}} % deines Nettogehalts ({{period}})',
  'form.heading': 'Beginne mit deinem Einkommen',
  'form.setupNote': 'Eine kurze Einrichtung.',
  'form.incomeLabel': 'Nettoeinkommen',
  'form.incomeDescription': 'Betrag in {{currency}}, nach Steuern.',
  'form.payFrequencyLabel': 'Zahlungsrhythmus',
  'form.weeklyHoursLabel': 'Arbeitsstunden pro Woche',
  'form.workingDaysLabel': 'Arbeitstage pro Woche',
  'form.currencyLabel': 'Währung',
  'form.languageLabel': 'Sprache',
  'form.themeLabel': 'Darstellung',
  'form.cancel': 'Abbrechen',
  'form.start': 'Berechnung starten',
  'form.save': 'Einstellungen speichern',
  'validation.income': 'Gib ein Einkommen über 0 ein.',
  'validation.payFrequency': 'Wähle aus, wie oft du bezahlt wirst.',
  'validation.weeklyHours': 'Verwende 1 bis 168 Stunden pro Woche.',
  'validation.workingDays': 'Verwende eine ganze Zahl von 1 bis 7.',
  'validation.currency': 'Wähle eine Währung.',
  'validation.language': 'Wähle eine Sprache.',
  'validation.theme': 'Wähle eine Darstellung.',
  'settings.title': 'Einstellungen',
  'settings.close': 'Einstellungen schließen',
  'settings.resetTitle': 'Einstellungen zurücksetzen?',
  'settings.resetDescription':
    'Die auf diesem Gerät gespeicherten Einkommensdaten werden entfernt.',
  'settings.resetFailure':
    'Gespeicherte Einstellungen konnten nicht gelöscht werden. Nichts wurde geändert.',
  'settings.keep': 'Einstellungen behalten',
  'settings.reset': 'Zurücksetzen',
  'settings.resetSaved': 'Gespeicherte Einstellungen zurücksetzen',
  'update.newReady': 'Ein neues Affordi ist bereit.',
  'update.latest': 'Jetzt aktualisieren, um die neueste Version zu nutzen.',
  'update.update': 'Aktualisieren',
  'update.dismiss': 'Benachrichtigung schließen',
  'duration.lessThanMinute': 'Weniger als 1 Minute',
  'duration.moreThanWorkweeks': 'Mehr als {{count}} Arbeitswochen',
  'duration.ofWork': '{{duration}} Arbeitszeit',
  'theme.system': 'System',
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
};

const french: Catalog = {
  'app.tagline': 'Voyez ce que les choses vous coûtent vraiment en temps.',
  'app.settingsStay':
    'Vos réglages restent sur cet appareil. Vous pouvez les modifier à tout moment.',
  'storage.visitOnly':
    'Enregistré pour cette visite. Votre navigateur a bloqué l’enregistrement local.',
  'storage.couldNotSave':
    'Les réglages sont disponibles pour cette visite, mais n’ont pas pu être enregistrés.',
  'calculator.settings': 'Réglages',
  'calculator.title': 'Combien cela coûte-t-il en temps ?',
  'calculator.priceLabel': 'Saisissez un prix',
  'calculator.priceDescription': 'Prix en {{currency}}.',
  'calculator.priceError': 'Saisissez un prix valide et non négatif avec des chiffres, . ou ,.',
  'calculator.resultIs': '{{price}} représente',
  'calculator.emptyResult': 'Saisissez un prix pour voir son coût en temps.',
  'calculator.payContext': '{{percentage}} % de votre revenu net ({{period}})',
  'form.heading': 'Commencez par vos revenus',
  'form.setupNote': 'Une configuration rapide.',
  'form.incomeLabel': 'Revenu net',
  'form.incomeDescription': 'Montant en {{currency}}, après impôts.',
  'form.payFrequencyLabel': 'Fréquence de paiement',
  'form.weeklyHoursLabel': 'Heures de travail par semaine',
  'form.workingDaysLabel': 'Jours travaillés par semaine',
  'form.currencyLabel': 'Devise',
  'form.languageLabel': 'Langue',
  'form.themeLabel': 'Apparence',
  'form.cancel': 'Annuler',
  'form.start': 'Commencer le calcul',
  'form.save': 'Enregistrer les réglages',
  'validation.income': 'Saisissez un revenu supérieur à 0.',
  'validation.payFrequency': 'Choisissez la fréquence de votre paiement.',
  'validation.weeklyHours': 'Utilisez entre 1 et 168 heures par semaine.',
  'validation.workingDays': 'Utilisez un nombre entier de 1 à 7.',
  'validation.currency': 'Choisissez une devise.',
  'validation.language': 'Choisissez une langue.',
  'validation.theme': 'Choisissez une apparence.',
  'settings.title': 'Réglages',
  'settings.close': 'Fermer les réglages',
  'settings.resetTitle': 'Réinitialiser les réglages ?',
  'settings.resetDescription':
    'Les informations de revenus enregistrées sur cet appareil seront supprimées.',
  'settings.resetFailure': 'Impossible d’effacer les réglages enregistrés. Rien n’a été modifié.',
  'settings.keep': 'Garder les réglages',
  'settings.reset': 'Réinitialiser',
  'settings.resetSaved': 'Réinitialiser les réglages enregistrés',
  'update.newReady': 'Une nouvelle version d’Affordi est prête.',
  'update.latest': 'Mettez à jour pour utiliser la dernière version.',
  'update.update': 'Mettre à jour',
  'update.dismiss': 'Fermer la notification',
  'duration.lessThanMinute': 'Moins d’une minute',
  'duration.moreThanWorkweeks': 'Plus de {{count}} semaines de travail',
  'duration.ofWork': '{{duration}} de travail',
  'theme.system': 'Système',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
};

const italian: Catalog = {
  'app.tagline': 'Scopri quanto ti costano davvero le cose in termini di tempo.',
  'app.settingsStay':
    'Le tue impostazioni restano su questo dispositivo. Puoi cambiarle in qualsiasi momento.',
  'storage.visitOnly': 'Salvate per questa visita. Il browser ha bloccato il salvataggio locale.',
  'storage.couldNotSave':
    'Le impostazioni sono disponibili per questa visita, ma non è stato possibile salvarle.',
  'calculator.settings': 'Impostazioni',
  'calculator.title': 'Quanto costa in termini di tempo?',
  'calculator.priceLabel': 'Inserisci un prezzo',
  'calculator.priceDescription': 'Prezzo in {{currency}}.',
  'calculator.priceError': 'Inserisci un prezzo valido non negativo usando numeri, . o ,.',
  'calculator.resultIs': '{{price}} equivale a',
  'calculator.emptyResult': 'Inserisci un prezzo per vedere il suo costo in tempo.',
  'calculator.payContext': '{{percentage}}% del tuo stipendio netto ({{period}})',
  'form.heading': 'Inizia dal tuo reddito',
  'form.setupNote': 'Una configurazione rapida.',
  'form.incomeLabel': 'Reddito netto',
  'form.incomeDescription': 'Importo in {{currency}}, dopo le tasse.',
  'form.payFrequencyLabel': 'Frequenza di pagamento',
  'form.weeklyHoursLabel': 'Ore di lavoro ogni settimana',
  'form.workingDaysLabel': 'Giorni lavorativi ogni settimana',
  'form.currencyLabel': 'Valuta',
  'form.languageLabel': 'Lingua',
  'form.themeLabel': 'Aspetto',
  'form.cancel': 'Annulla',
  'form.start': 'Inizia il calcolo',
  'form.save': 'Salva impostazioni',
  'validation.income': 'Inserisci un reddito maggiore di 0.',
  'validation.payFrequency': 'Scegli con quale frequenza vieni pagato.',
  'validation.weeklyHours': 'Usa da 1 a 168 ore ogni settimana.',
  'validation.workingDays': 'Usa un numero intero da 1 a 7.',
  'validation.currency': 'Scegli una valuta.',
  'validation.language': 'Scegli una lingua.',
  'validation.theme': 'Scegli un aspetto.',
  'settings.title': 'Impostazioni',
  'settings.close': 'Chiudi impostazioni',
  'settings.resetTitle': 'Reimpostare le impostazioni?',
  'settings.resetDescription': 'I dati sul reddito salvati su questo dispositivo verranno rimossi.',
  'settings.resetFailure':
    'Impossibile cancellare le impostazioni salvate. Non è stato modificato nulla.',
  'settings.keep': 'Mantieni impostazioni',
  'settings.reset': 'Reimposta',
  'settings.resetSaved': 'Reimposta impostazioni salvate',
  'update.newReady': 'Una nuova versione di Affordi è pronta.',
  'update.latest': 'Aggiorna ora per usare l’ultima versione.',
  'update.update': 'Aggiorna',
  'update.dismiss': 'Chiudi notifica',
  'duration.lessThanMinute': 'Meno di un minuto',
  'duration.moreThanWorkweeks': 'Più di {{count}} settimane lavorative',
  'duration.ofWork': '{{duration}} di lavoro',
  'theme.system': 'Sistema',
  'theme.light': 'Chiaro',
  'theme.dark': 'Scuro',
};

const serbian: Catalog = {
  'app.tagline': 'Pogledajte koliko vas stvari zaista koštaju u vremenu.',
  'app.settingsStay':
    'Vaša podešavanja ostaju na ovom uređaju. Možete ih promeniti kad god želite.',
  'storage.visitOnly': 'Sačuvano za ovu posetu. Vaš pregledač je blokirao lokalno čuvanje.',
  'storage.couldNotSave': 'Podešavanja su dostupna za ovu posetu, ali nisu mogla da budu sačuvana.',
  'calculator.settings': 'Podešavanja',
  'calculator.title': 'Koliko to košta u vremenu?',
  'calculator.priceLabel': 'Unesite cenu',
  'calculator.priceDescription': 'Cena u valuti {{currency}}.',
  'calculator.priceError': 'Unesite važeću cenu koja nije negativna, koristeći cifre, . ili ,.',
  'calculator.resultIs': '{{price}} je',
  'calculator.emptyResult': 'Unesite cenu da vidite njen trošak u vremenu.',
  'calculator.payContext': '{{percentage}}% vaše neto plate ({{period}})',
  'form.heading': 'Počnite od svojih prihoda',
  'form.setupNote': 'Brzo početno podešavanje.',
  'form.incomeLabel': 'Neto prihod',
  'form.incomeDescription': 'Iznos u valuti {{currency}}, posle poreza.',
  'form.payFrequencyLabel': 'Učestalost isplate',
  'form.weeklyHoursLabel': 'Radni sati nedeljno',
  'form.workingDaysLabel': 'Radni dani nedeljno',
  'form.currencyLabel': 'Valuta',
  'form.languageLabel': 'Jezik',
  'form.themeLabel': 'Izgled',
  'form.cancel': 'Otkaži',
  'form.start': 'Započni računanje',
  'form.save': 'Sačuvaj podešavanja',
  'validation.income': 'Unesite prihod veći od 0.',
  'validation.payFrequency': 'Izaberite koliko često primate platu.',
  'validation.weeklyHours': 'Unesite od 1 do 168 sati nedeljno.',
  'validation.workingDays': 'Unesite ceo broj od 1 do 7.',
  'validation.currency': 'Izaberite valutu.',
  'validation.language': 'Izaberite jezik.',
  'validation.theme': 'Izaberite izgled.',
  'settings.title': 'Podešavanja',
  'settings.close': 'Zatvori podešavanja',
  'settings.resetTitle': 'Resetovati podešavanja?',
  'settings.resetDescription': 'Biće uklonjeni podaci o prihodima sačuvani na ovom uređaju.',
  'settings.resetFailure': 'Sačuvana podešavanja ne mogu da se obrišu. Ništa nije promenjeno.',
  'settings.keep': 'Zadrži podešavanja',
  'settings.reset': 'Resetuj',
  'settings.resetSaved': 'Resetuj sačuvana podešavanja',
  'update.newReady': 'Nova verzija Affordi aplikacije je spremna.',
  'update.latest': 'Ažurirajte sada za najnoviju verziju.',
  'update.update': 'Ažuriraj',
  'update.dismiss': 'Zatvori obaveštenje',
  'duration.lessThanMinute': 'Manje od 1 minuta',
  'duration.moreThanWorkweeks': 'Više od {{count}} radnih nedelja',
  'duration.ofWork': '{{duration}} rada',
  'theme.system': 'Sistem',
  'theme.light': 'Svetlo',
  'theme.dark': 'Tamno',
};

const catalogs: Record<Locale, Catalog> = {
  en: english,
  de: german,
  fr: french,
  it: italian,
  sr: serbian,
};
const supportedLocaleSet: ReadonlySet<string> = new Set(supportedLocales);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocaleSet.has(value);
}

function browserLocales(): string[] {
  if (typeof navigator === 'undefined') return [];
  return [...(navigator.languages ?? []), navigator.language].filter(
    (value, index, all): value is string =>
      typeof value === 'string' && all.indexOf(value) === index,
  );
}

/** Resolves a BCP-47 language tag to one of Affordi's supported locales. */
export function detectLocale(input?: string | readonly string[]): Locale {
  const candidates =
    input === undefined ? browserLocales() : typeof input === 'string' ? [input] : input;

  for (const candidate of candidates) {
    const language = candidate.trim().toLowerCase().replace('_', '-').split('-')[0] ?? '';
    if (isLocale(language)) return language;
  }

  return 'en';
}

export const resolveLocale = detectLocale;

function interpolate(template: string, values?: Readonly<Record<string, string | number>>): string {
  if (values === undefined) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

function numberFor(locale: Locale, value: number): string {
  return Number.isFinite(value) ? new Intl.NumberFormat(locale).format(value) : String(value);
}

function serbianUnit(value: number, one: string, few: string, many: string): string {
  const integer = Math.abs(Math.trunc(value));
  const lastTwo = integer % 100;
  if (integer % 10 === 1 && lastTwo !== 11) return one;
  if (integer % 10 >= 2 && integer % 10 <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

const unitForms: Record<Exclude<Locale, 'sr'>, Record<DurationUnit, readonly [string, string]>> = {
  en: {
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    workday: ['workday', 'workdays'],
    day: ['day', 'days'],
    workweek: ['workweek', 'workweeks'],
  },
  de: {
    minute: ['Minute', 'Minuten'],
    hour: ['Stunde', 'Stunden'],
    workday: ['Arbeitstag', 'Arbeitstage'],
    day: ['Tag', 'Tage'],
    workweek: ['Arbeitswoche', 'Arbeitswochen'],
  },
  fr: {
    minute: ['minute', 'minutes'],
    hour: ['heure', 'heures'],
    workday: ['journée de travail', 'journées de travail'],
    day: ['jour', 'jours'],
    workweek: ['semaine de travail', 'semaines de travail'],
  },
  it: {
    minute: ['minuto', 'minuti'],
    hour: ['ora', 'ore'],
    workday: ['giornata lavorativa', 'giornate lavorative'],
    day: ['giorno', 'giorni'],
    workweek: ['settimana lavorativa', 'settimane lavorative'],
  },
};

const payFrequencyForms: Record<Locale, Record<PayFrequency, string>> = {
  en: {
    hourly: 'Hourly',
    weekly: 'Weekly',
    biweekly: 'Every two weeks',
    monthly: 'Monthly',
    yearly: 'Yearly',
  },
  de: {
    hourly: 'Stündlich',
    weekly: 'Wöchentlich',
    biweekly: 'Alle zwei Wochen',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
  },
  fr: {
    hourly: 'Chaque heure',
    weekly: 'Chaque semaine',
    biweekly: 'Toutes les deux semaines',
    monthly: 'Chaque mois',
    yearly: 'Chaque année',
  },
  it: {
    hourly: 'Ogni ora',
    weekly: 'Ogni settimana',
    biweekly: 'Ogni due settimane',
    monthly: 'Ogni mese',
    yearly: 'Ogni anno',
  },
  sr: {
    hourly: 'Po satu',
    weekly: 'Nedeljno',
    biweekly: 'Na svake dve nedelje',
    monthly: 'Mesečno',
    yearly: 'Godišnje',
  },
};

const languageNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  sr: 'Srpski',
};

export interface Translator {
  readonly locale: Locale;
  t(key: TranslationKey, values?: Readonly<Record<string, string | number>>): string;
  payFrequency(frequency: PayFrequency): string;
  payPeriod(frequency: PayFrequency): string;
  language(language: Locale): string;
  theme(theme: ThemePreference): string;
  unit(value: number, unit: DurationUnit): string;
  duration(parts: readonly DurationPart[]): string;
  lessThanMinute(): string;
  moreThanWorkweeks(count: number): string;
  ofWork(duration: string): string;
}

/** Creates a small, dependency-free translator for components and domain formatters. */
export function createTranslator(requestedLocale?: string): Translator {
  const locale = detectLocale(requestedLocale);
  const catalog = catalogs[locale];

  function t(key: TranslationKey, values?: Readonly<Record<string, string | number>>) {
    return interpolate(catalog[key], values);
  }

  function unit(value: number, durationUnit: DurationUnit): string {
    const amount = numberFor(locale, value);
    if (locale === 'sr') {
      const forms: Record<DurationUnit, readonly [string, string, string]> = {
        minute: ['minut', 'minuta', 'minuta'],
        hour: ['sat', 'sata', 'sati'],
        workday: ['radni dan', 'radna dana', 'radnih dana'],
        day: ['dan', 'dana', 'dana'],
        workweek: ['radna nedelja', 'radne nedelje', 'radnih nedelja'],
      };
      const [one, few, many] = forms[durationUnit];
      return `${amount} ${serbianUnit(value, one, few, many)}`;
    }

    const [singular, plural] = unitForms[locale][durationUnit];
    return `${amount} ${value === 1 ? singular : plural}`;
  }

  return {
    locale,
    t,
    payFrequency: (frequency) => payFrequencyForms[locale][frequency],
    payPeriod: (frequency) => payFrequencyForms[locale][frequency].toLocaleLowerCase(locale),
    language: (language) => languageNames[language],
    theme: (theme) => t(`theme.${theme}`),
    unit,
    duration: (parts) => parts.map((part) => unit(part.value, part.unit)).join(' '),
    lessThanMinute: () => t('duration.lessThanMinute'),
    moreThanWorkweeks: (count) =>
      t('duration.moreThanWorkweeks', { count: numberFor(locale, count) }),
    ofWork: (duration) => t('duration.ofWork', { duration }),
  };
}

export function translate(
  locale: string | undefined,
  key: TranslationKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  return createTranslator(locale).t(key, values);
}
