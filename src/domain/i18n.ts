import type { PayFrequency } from './calculations';
import type { ThemePreference } from './theme';

/** The languages currently available in the Affordi interface. */
export const supportedLocales = ['en', 'de', 'fr', 'it', 'sr'] as const;

export type Locale = (typeof supportedLocales)[number];

export type DurationUnit = 'minute' | 'hour' | 'workday' | 'week' | 'month' | 'year';

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
  'storage.visitOnly',
  'storage.couldNotSave',
  'calculator.settings',
  'calculator.title',
  'calculator.priceLabel',
  'calculator.priceDescription',
  'calculator.priceError',
  'calculator.done',
  'calculator.resultIs',
  'calculator.emptyResult',
  'calculator.payContext',
  'calculator.repeatLabel',
  'calculator.repeat.once',
  'calculator.repeat.monthly',
  'calculator.repeat.yearly',
  'calculator.resultIsMonthly',
  'calculator.resultIsYearly',
  'calculator.overYear',
  'calculator.eachMonth',
  'calculator.savingTime',
  'form.heading',
  'form.setupNote',
  'form.incomeLabel',
  'form.incomeDescription',
  'form.payFrequencyLabel',
  'form.weeklyHoursLabel',
  'form.workingDaysLabel',
  'form.savingsLabel',
  'form.savingsHint',
  'form.savingsDescription',
  'form.currencyLabel',
  'form.languageLabel',
  'form.themeLabel',
  'form.cancel',
  'form.start',
  'form.save',
  'privacy.localOnly',
  'privacy.showIncome',
  'privacy.hideIncome',
  'validation.income',
  'validation.payFrequency',
  'validation.weeklyHours',
  'validation.workingDays',
  'validation.hoursPerDay',
  'validation.savings',
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
  'duration.moreThanWeeks',
  'duration.and',
  'duration.ofWork',
  'saving.underWeek',
  'saving.overYears',
  'theme.system',
  'theme.light',
  'theme.dark',
] as const;

export type TranslationKey = (typeof translationKeys)[number];
type Catalog = Record<TranslationKey, string>;

const english: Catalog = {
  'app.tagline': 'See what things really cost in your time.',
  'storage.visitOnly': 'Saved for this visit. Your browser blocked local saving.',
  'storage.couldNotSave': 'Settings are available for this visit, but could not be saved.',
  'calculator.settings': 'Settings',
  'calculator.title': 'How much does it cost?',
  'calculator.priceLabel': 'Enter a price',
  'calculator.priceDescription': 'Price in {{currency}}.',
  'calculator.priceError': 'Enter a price of 0 or more.',
  'calculator.done': 'Done',
  'calculator.resultIs': '{{price}} is',
  'calculator.emptyResult': 'Enter a price to see its time cost.',
  'calculator.payContext': '{{percentage}}% of your {{period}} take home pay',
  'calculator.repeatLabel': 'How often you pay',
  'calculator.repeat.once': 'Once',
  'calculator.repeat.monthly': 'Monthly',
  'calculator.repeat.yearly': 'Yearly',
  'calculator.resultIsMonthly': '{{price}} a month is',
  'calculator.resultIsYearly': '{{price}} a year is',
  'calculator.overYear': 'Over a year: {{duration}}',
  'calculator.eachMonth': 'Each month: {{duration}}',
  'calculator.savingTime': 'Time to save for it: {{duration}}',
  'form.heading': 'Start with your income',
  'form.setupNote': 'One quick setup.',
  'form.incomeLabel': 'Take home income',
  'form.incomeDescription': 'Amount in {{currency}}, after tax.',
  'form.payFrequencyLabel': 'Pay frequency',
  'form.weeklyHoursLabel': 'Work hours each week',
  'form.workingDaysLabel': 'Work days each week',
  'form.savingsLabel': 'Monthly savings (optional)',
  'form.savingsHint': 'Shows how long it takes to save for a price.',
  'form.savingsDescription': 'Amount in {{currency}}.',
  'form.currencyLabel': 'Currency',
  'form.languageLabel': 'Language',
  'form.themeLabel': 'Appearance',
  'form.cancel': 'Cancel',
  'form.start': 'Start calculating',
  'form.save': 'Save settings',
  'privacy.localOnly': 'Saved only on this device.',
  'privacy.showIncome': 'Show income',
  'privacy.hideIncome': 'Hide income',
  'validation.income': 'Enter an income greater than 0.',
  'validation.payFrequency': 'Choose how often you are paid.',
  'validation.weeklyHours': 'Use between 1 and 168 hours each week.',
  'validation.workingDays': 'Use a whole number from 1 to 7.',
  'validation.hoursPerDay': 'Use no more than 24 hours for each work day.',
  'validation.savings': 'Enter 0 or more, or leave it empty.',
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
  'update.newReady': 'A new version of Affordi is ready.',
  'update.latest': 'Update now for the latest version.',
  'update.update': 'Update',
  'update.dismiss': 'Dismiss notification',
  'duration.lessThanMinute': 'Less than 1 minute',
  'duration.moreThanWeeks': 'More than {{count}} weeks',
  'duration.and': 'and',
  'duration.ofWork': '{{duration}} of work',
  'saving.underWeek': 'under 1 week',
  'saving.overYears': 'over {{count}} years',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
};

const german: Catalog = {
  'app.tagline': 'Sieh, was Dinge wirklich an Zeit kosten.',
  'storage.visitOnly':
    'Für diesen Besuch gespeichert. Dein Browser hat das lokale Speichern blockiert.',
  'storage.couldNotSave':
    'Die Einstellungen sind für diesen Besuch verfügbar, konnten aber nicht gespeichert werden.',
  'calculator.settings': 'Einstellungen',
  'calculator.title': 'Was kostet es an Zeit?',
  'calculator.priceLabel': 'Preis eingeben',
  'calculator.priceDescription': 'Preis in {{currency}}.',
  'calculator.priceError': 'Gib einen Preis von 0 oder mehr ein.',
  'calculator.done': 'Fertig',
  'calculator.resultIs': '{{price}} entspricht',
  'calculator.emptyResult': 'Gib einen Preis ein, um die Kosten in Zeit zu sehen.',
  'calculator.payContext': '{{percentage}} % deines {{period}} Nettoeinkommens',
  'calculator.repeatLabel': 'Wie oft du zahlst',
  'calculator.repeat.once': 'Einmalig',
  'calculator.repeat.monthly': 'Monatlich',
  'calculator.repeat.yearly': 'Jährlich',
  'calculator.resultIsMonthly': '{{price}} im Monat entspricht',
  'calculator.resultIsYearly': '{{price}} im Jahr entspricht',
  'calculator.overYear': 'Aufs Jahr gerechnet: {{duration}}',
  'calculator.eachMonth': 'Pro Monat: {{duration}}',
  'calculator.savingTime': 'Zeit zum Ansparen: {{duration}}',
  'form.heading': 'Beginne mit deinem Einkommen',
  'form.setupNote': 'Eine kurze Einrichtung.',
  'form.incomeLabel': 'Nettoeinkommen',
  'form.incomeDescription': 'Betrag in {{currency}}, nach Steuern.',
  'form.payFrequencyLabel': 'Zahlungsrhythmus',
  'form.weeklyHoursLabel': 'Arbeitsstunden pro Woche',
  'form.workingDaysLabel': 'Arbeitstage pro Woche',
  'form.savingsLabel': 'Monatliche Ersparnis (optional)',
  'form.savingsHint': 'Zeigt, wie lange du für einen Preis sparen musst.',
  'form.savingsDescription': 'Betrag in {{currency}}.',
  'form.currencyLabel': 'Währung',
  'form.languageLabel': 'Sprache',
  'form.themeLabel': 'Darstellung',
  'form.cancel': 'Abbrechen',
  'form.start': 'Berechnung starten',
  'form.save': 'Einstellungen speichern',
  'privacy.localOnly': 'Nur auf diesem Gerät gespeichert.',
  'privacy.showIncome': 'Einkommen anzeigen',
  'privacy.hideIncome': 'Einkommen ausblenden',
  'validation.income': 'Gib ein Einkommen über 0 ein.',
  'validation.payFrequency': 'Wähle aus, wie oft du bezahlt wirst.',
  'validation.weeklyHours': 'Verwende 1 bis 168 Stunden pro Woche.',
  'validation.workingDays': 'Verwende eine ganze Zahl von 1 bis 7.',
  'validation.hoursPerDay': 'Verwende höchstens 24 Stunden pro Arbeitstag.',
  'validation.savings': 'Gib 0 oder mehr ein oder lass das Feld leer.',
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
  'update.newReady': 'Eine neue Version von Affordi ist bereit.',
  'update.latest': 'Jetzt aktualisieren, um die neueste Version zu nutzen.',
  'update.update': 'Aktualisieren',
  'update.dismiss': 'Benachrichtigung schließen',
  'duration.lessThanMinute': 'Weniger als 1 Minute',
  'duration.moreThanWeeks': 'Mehr als {{count}} Wochen',
  'duration.and': 'und',
  'duration.ofWork': '{{duration}} Arbeitszeit',
  'saving.underWeek': 'unter 1 Woche',
  'saving.overYears': 'über {{count}} Jahre',
  'theme.system': 'System',
  'theme.light': 'Hell',
  'theme.dark': 'Dunkel',
};

const french: Catalog = {
  'app.tagline': 'Voyez ce que les choses vous coûtent vraiment en temps.',
  'storage.visitOnly':
    'Enregistré pour cette visite. Votre navigateur a bloqué l’enregistrement local.',
  'storage.couldNotSave':
    'Les réglages sont disponibles pour cette visite, mais n’ont pas pu être enregistrés.',
  'calculator.settings': 'Réglages',
  'calculator.title': 'Quel est son coût en temps ?',
  'calculator.priceLabel': 'Saisissez un prix',
  'calculator.priceDescription': 'Prix en {{currency}}.',
  'calculator.priceError': 'Saisissez un prix de 0 ou plus.',
  'calculator.done': 'Terminé',
  'calculator.resultIs': '{{price}} représente',
  'calculator.emptyResult': 'Saisissez un prix pour voir son coût en temps.',
  'calculator.payContext': '{{percentage}} % de votre revenu net, {{period}}',
  'calculator.repeatLabel': 'À quelle fréquence vous payez',
  'calculator.repeat.once': 'Une fois',
  'calculator.repeat.monthly': 'Par mois',
  'calculator.repeat.yearly': 'Par an',
  'calculator.resultIsMonthly': '{{price}} par mois représente',
  'calculator.resultIsYearly': '{{price}} par an représente',
  'calculator.overYear': 'Sur un an : {{duration}}',
  'calculator.eachMonth': 'Par mois : {{duration}}',
  'calculator.savingTime': 'Temps d’épargne nécessaire : {{duration}}',
  'form.heading': 'Commencez par vos revenus',
  'form.setupNote': 'Une configuration rapide.',
  'form.incomeLabel': 'Revenu net',
  'form.incomeDescription': 'Montant en {{currency}}, après impôts.',
  'form.payFrequencyLabel': 'Fréquence de paiement',
  'form.weeklyHoursLabel': 'Heures de travail par semaine',
  'form.workingDaysLabel': 'Jours travaillés par semaine',
  'form.savingsLabel': 'Épargne mensuelle (facultatif)',
  'form.savingsHint': 'Indique le temps d’épargne nécessaire pour un achat.',
  'form.savingsDescription': 'Montant en {{currency}}.',
  'form.currencyLabel': 'Devise',
  'form.languageLabel': 'Langue',
  'form.themeLabel': 'Apparence',
  'form.cancel': 'Annuler',
  'form.start': 'Commencer le calcul',
  'form.save': 'Enregistrer les réglages',
  'privacy.localOnly': 'Enregistré uniquement sur cet appareil.',
  'privacy.showIncome': 'Afficher le revenu',
  'privacy.hideIncome': 'Masquer le revenu',
  'validation.income': 'Saisissez un revenu supérieur à 0.',
  'validation.payFrequency': 'Choisissez la fréquence de votre paiement.',
  'validation.weeklyHours': 'Utilisez entre 1 et 168 heures par semaine.',
  'validation.workingDays': 'Utilisez un nombre entier de 1 à 7.',
  'validation.hoursPerDay': 'Utilisez au plus 24 heures par jour travaillé.',
  'validation.savings': 'Saisissez 0 ou plus, ou laissez le champ vide.',
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
  'duration.moreThanWeeks': 'Plus de {{count}} semaines',
  'duration.and': 'et',
  'duration.ofWork': '{{duration}} de travail',
  'saving.underWeek': 'moins d’une semaine',
  'saving.overYears': 'plus de {{count}} ans',
  'theme.system': 'Système',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
};

const italian: Catalog = {
  'app.tagline': 'Scopri quanto ti costano davvero le cose in termini di tempo.',
  'storage.visitOnly': 'Salvate per questa visita. Il browser ha bloccato il salvataggio locale.',
  'storage.couldNotSave':
    'Le impostazioni sono disponibili per questa visita, ma non è stato possibile salvarle.',
  'calculator.settings': 'Impostazioni',
  'calculator.title': 'Quanto costa in termini di tempo?',
  'calculator.priceLabel': 'Inserisci un prezzo',
  'calculator.priceDescription': 'Prezzo in {{currency}}.',
  'calculator.priceError': 'Inserisci un prezzo pari a 0 o superiore.',
  'calculator.done': 'Fine',
  'calculator.resultIs': '{{price}} equivale a',
  'calculator.emptyResult': 'Inserisci un prezzo per vedere il suo costo in tempo.',
  'calculator.payContext': '{{percentage}}% del tuo stipendio netto, {{period}}',
  'calculator.repeatLabel': 'Quanto spesso paghi',
  'calculator.repeat.once': 'Una volta',
  'calculator.repeat.monthly': 'Al mese',
  'calculator.repeat.yearly': 'All’anno',
  'calculator.resultIsMonthly': '{{price}} al mese equivale a',
  'calculator.resultIsYearly': '{{price}} all’anno equivale a',
  'calculator.overYear': 'In un anno: {{duration}}',
  'calculator.eachMonth': 'Al mese: {{duration}}',
  'calculator.savingTime': 'Tempo per risparmiare: {{duration}}',
  'form.heading': 'Inizia dal tuo reddito',
  'form.setupNote': 'Una configurazione rapida.',
  'form.incomeLabel': 'Reddito netto',
  'form.incomeDescription': 'Importo in {{currency}}, dopo le tasse.',
  'form.payFrequencyLabel': 'Frequenza di pagamento',
  'form.weeklyHoursLabel': 'Ore di lavoro ogni settimana',
  'form.workingDaysLabel': 'Giorni lavorativi ogni settimana',
  'form.savingsLabel': 'Risparmio mensile (facoltativo)',
  'form.savingsHint': 'Mostra quanto tempo serve per risparmiare per un acquisto.',
  'form.savingsDescription': 'Importo in {{currency}}.',
  'form.currencyLabel': 'Valuta',
  'form.languageLabel': 'Lingua',
  'form.themeLabel': 'Aspetto',
  'form.cancel': 'Annulla',
  'form.start': 'Inizia il calcolo',
  'form.save': 'Salva impostazioni',
  'privacy.localOnly': 'Salvato solo su questo dispositivo.',
  'privacy.showIncome': 'Mostra reddito',
  'privacy.hideIncome': 'Nascondi reddito',
  'validation.income': 'Inserisci un reddito maggiore di 0.',
  'validation.payFrequency': 'Scegli con quale frequenza vieni pagato.',
  'validation.weeklyHours': 'Usa da 1 a 168 ore ogni settimana.',
  'validation.workingDays': 'Usa un numero intero da 1 a 7.',
  'validation.hoursPerDay': 'Usa al massimo 24 ore per giorno lavorativo.',
  'validation.savings': 'Inserisci 0 o più, oppure lascia vuoto il campo.',
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
  'duration.moreThanWeeks': 'Più di {{count}} settimane',
  'duration.and': 'e',
  'duration.ofWork': '{{duration}} di lavoro',
  'saving.underWeek': 'meno di una settimana',
  'saving.overYears': 'più di {{count}} anni',
  'theme.system': 'Sistema',
  'theme.light': 'Chiaro',
  'theme.dark': 'Scuro',
};

const serbian: Catalog = {
  'app.tagline': 'Pogledajte koliko vas stvari zaista koštaju u vremenu.',
  'storage.visitOnly': 'Sačuvano za ovu posetu. Vaš pregledač je blokirao lokalno čuvanje.',
  'storage.couldNotSave': 'Podešavanja su dostupna za ovu posetu, ali nisu mogla da budu sačuvana.',
  'calculator.settings': 'Podešavanja',
  'calculator.title': 'Koliko to košta u vremenu?',
  'calculator.priceLabel': 'Unesite cenu',
  'calculator.priceDescription': 'Cena u valuti {{currency}}.',
  'calculator.priceError': 'Unesite cenu od 0 ili više.',
  'calculator.done': 'Gotovo',
  'calculator.resultIs': '{{price}} je',
  'calculator.emptyResult': 'Unesite cenu da vidite njen trošak u vremenu.',
  'calculator.payContext': '{{percentage}}% vaše neto plate, {{period}}',
  'calculator.repeatLabel': 'Koliko često plaćate',
  'calculator.repeat.once': 'Jednom',
  'calculator.repeat.monthly': 'Mesečno',
  'calculator.repeat.yearly': 'Godišnje',
  'calculator.resultIsMonthly': '{{price}} mesečno je',
  'calculator.resultIsYearly': '{{price}} godišnje je',
  'calculator.overYear': 'Za godinu dana: {{duration}}',
  'calculator.eachMonth': 'Mesečno: {{duration}}',
  'calculator.savingTime': 'Potrebno vreme štednje: {{duration}}',
  'form.heading': 'Počnite od svojih prihoda',
  'form.setupNote': 'Brzo početno podešavanje.',
  'form.incomeLabel': 'Neto prihod',
  'form.incomeDescription': 'Iznos u valuti {{currency}}, posle poreza.',
  'form.payFrequencyLabel': 'Učestalost isplate',
  'form.weeklyHoursLabel': 'Radni sati nedeljno',
  'form.workingDaysLabel': 'Radni dani nedeljno',
  'form.savingsLabel': 'Mesečna ušteda (opciono)',
  'form.savingsHint': 'Pokazuje koliko dugo treba da štedite za kupovinu.',
  'form.savingsDescription': 'Iznos u valuti {{currency}}.',
  'form.currencyLabel': 'Valuta',
  'form.languageLabel': 'Jezik',
  'form.themeLabel': 'Izgled',
  'form.cancel': 'Otkaži',
  'form.start': 'Započni računanje',
  'form.save': 'Sačuvaj podešavanja',
  'privacy.localOnly': 'Čuva se samo na ovom uređaju.',
  'privacy.showIncome': 'Prikaži prihod',
  'privacy.hideIncome': 'Sakrij prihod',
  'validation.income': 'Unesite prihod veći od 0.',
  'validation.payFrequency': 'Izaberite koliko često primate platu.',
  'validation.weeklyHours': 'Unesite od 1 do 168 sati nedeljno.',
  'validation.workingDays': 'Unesite ceo broj od 1 do 7.',
  'validation.hoursPerDay': 'Unesite najviše 24 sata po radnom danu.',
  'validation.savings': 'Unesite 0 ili više, ili ostavite polje prazno.',
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
  'duration.moreThanWeeks': 'Više od {{count}} nedelja',
  'duration.and': 'i',
  'duration.ofWork': '{{duration}} rada',
  'saving.underWeek': 'manje od nedelju dana',
  'saving.overYears': 'više od {{count}} godina',
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

function interpolate(template: string, values?: Readonly<Record<string, string | number>>): string {
  if (values === undefined) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

const numberFormats = new Map<Locale, Intl.NumberFormat>();

function numberFor(locale: Locale, value: number): string {
  if (!Number.isFinite(value)) return String(value);
  let format = numberFormats.get(locale);
  if (format === undefined) {
    format = new Intl.NumberFormat(locale);
    numberFormats.set(locale, format);
  }
  return format.format(value);
}

function serbianUnit(value: number, one: string, few: string, many: string): string {
  const integer = Math.abs(Math.trunc(value));
  const lastTwo = integer % 100;
  if (integer % 10 === 1 && lastTwo !== 11) return one;
  if (integer % 10 >= 2 && integer % 10 <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

const serbianUnitForms: Record<DurationUnit, readonly [string, string, string]> = {
  minute: ['minut', 'minuta', 'minuta'],
  hour: ['sat', 'sata', 'sati'],
  workday: ['dan', 'dana', 'dana'],
  week: ['nedelja', 'nedelje', 'nedelja'],
  month: ['mesec', 'meseca', 'meseci'],
  year: ['godina', 'godine', 'godina'],
};

const unitForms: Record<Exclude<Locale, 'sr'>, Record<DurationUnit, readonly [string, string]>> = {
  en: {
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    workday: ['day', 'days'],
    week: ['week', 'weeks'],
    month: ['month', 'months'],
    year: ['year', 'years'],
  },
  de: {
    minute: ['Minute', 'Minuten'],
    hour: ['Stunde', 'Stunden'],
    workday: ['Tag', 'Tage'],
    week: ['Woche', 'Wochen'],
    month: ['Monat', 'Monate'],
    year: ['Jahr', 'Jahre'],
  },
  fr: {
    minute: ['minute', 'minutes'],
    hour: ['heure', 'heures'],
    workday: ['jour', 'jours'],
    week: ['semaine', 'semaines'],
    month: ['mois', 'mois'],
    year: ['an', 'ans'],
  },
  it: {
    minute: ['minuto', 'minuti'],
    hour: ['ora', 'ore'],
    workday: ['giorno', 'giorni'],
    week: ['settimana', 'settimane'],
    month: ['mese', 'mesi'],
    year: ['anno', 'anni'],
  },
};

const pluralRulesByLocale: Record<Exclude<Locale, 'sr'>, Intl.PluralRules> = {
  en: new Intl.PluralRules('en'),
  de: new Intl.PluralRules('de'),
  fr: new Intl.PluralRules('fr'),
  it: new Intl.PluralRules('it'),
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

/** Pay periods as they read inside `calculator.payContext` for each locale. */
const payPeriodForms: Record<Locale, Record<PayFrequency, string>> = {
  en: {
    hourly: 'hourly',
    weekly: 'weekly',
    biweekly: 'biweekly',
    monthly: 'monthly',
    yearly: 'yearly',
  },
  de: {
    hourly: 'stündlichen',
    weekly: 'wöchentlichen',
    biweekly: 'zweiwöchentlichen',
    monthly: 'monatlichen',
    yearly: 'jährlichen',
  },
  fr: {
    hourly: 'chaque heure',
    weekly: 'chaque semaine',
    biweekly: 'toutes les deux semaines',
    monthly: 'chaque mois',
    yearly: 'chaque année',
  },
  it: {
    hourly: 'ogni ora',
    weekly: 'ogni settimana',
    biweekly: 'ogni due settimane',
    monthly: 'ogni mese',
    yearly: 'ogni anno',
  },
  sr: {
    hourly: 'po satu',
    weekly: 'nedeljno',
    biweekly: 'na svake dve nedelje',
    monthly: 'mesečno',
    yearly: 'godišnje',
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
  duration(parts: readonly (DurationPart | string)[]): string;
  lessThanMinute(): string;
  moreThanWeeks(count: number): string;
  ofWork(duration: string): string;
}

/** Creates a small translator without runtime dependencies for components and domain formatters. */
export function createTranslator(requestedLocale?: string): Translator {
  const locale = detectLocale(requestedLocale);
  const catalog = catalogs[locale];

  function t(key: TranslationKey, values?: Readonly<Record<string, string | number>>) {
    return interpolate(catalog[key], values);
  }

  function unit(value: number, durationUnit: DurationUnit): string {
    const amount = numberFor(locale, value);
    if (locale === 'sr') {
      const [one, few, many] = serbianUnitForms[durationUnit];
      return `${amount} ${serbianUnit(value, one, few, many)}`;
    }

    const [singular, plural] = unitForms[locale][durationUnit];
    return `${amount} ${pluralRulesByLocale[locale].select(value) === 'one' ? singular : plural}`;
  }

  return {
    locale,
    t,
    payFrequency: (frequency) => payFrequencyForms[locale][frequency],
    payPeriod: (frequency) => payPeriodForms[locale][frequency],
    language: (language) => languageNames[language],
    theme: (theme) => t(`theme.${theme}`),
    unit,
    duration: (parts) =>
      parts
        .map((part) => (typeof part === 'string' ? part : unit(part.value, part.unit)))
        .join(` ${t('duration.and')} `),
    lessThanMinute: () => t('duration.lessThanMinute'),
    moreThanWeeks: (count) => t('duration.moreThanWeeks', { count: numberFor(locale, count) }),
    ofWork: (duration) => t('duration.ofWork', { duration }),
  };
}
