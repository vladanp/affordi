import type { PayFrequency } from './calculations';
import type { ThemePreference } from './theme';

/** The languages currently available in the Affordi interface. */
export const supportedLocales = ['en', 'de', 'fr', 'it', 'sr'] as const;

export type Locale = (typeof supportedLocales)[number];

export type DurationUnit = 'minute' | 'hour' | 'workday' | 'week';

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
  'calculator.repeat.workday',
  'calculator.repeat.weekly',
  'calculator.repeat.monthly',
  'calculator.repeat.yearly',
  'price.workday',
  'price.weekly',
  'price.monthly',
  'price.yearly',
  'calculator.overYear',
  'calculator.eachMonth',
  'calculator.earnedToday',
  'calculator.earnedTomorrow',
  'calculator.earnedOn',
  'calculator.earnedDate',
  'nav.cost',
  'nav.earnings',
  'earnings.title',
  'earnings.today',
  'earnings.todayNote',
  'earnings.atWork',
  'earnings.startsAt',
  'earnings.workingUntil',
  'earnings.timeLeft',
  'earnings.finishedAt',
  'earnings.dayOff',
  'earnings.month',
  'earnings.monthShare',
  'earnings.monthTotal',
  'earnings.workdays',
  'earnings.hideAmounts',
  'earnings.showAmounts',
  'earnings.hiddenAmount',
  'earnings.breakdown',
  'earnings.period',
  'earnings.aroundTheClock',
  'earnings.whileWorking',
  'earnings.per.second',
  'earnings.per.minute',
  'earnings.per.hour',
  'earnings.per.day',
  'earnings.per.week',
  'earnings.per.month',
  'earnings.per.year',
  'nav.fixedCosts',
  'fixedCosts.title',
  'fixedCosts.empty',
  'fixedCosts.add',
  'fixedCosts.addShort',
  'fixedCosts.total',
  'fixedCosts.left',
  'fixedCosts.short',
  'fixedCosts.perDay',
  'fixedCosts.shortNote',
  'fixedCosts.list',
  'fixedCosts.ofPay',
  'fixedCosts.share',
  'fixedCosts.lastPayment',
  'fixedCosts.ended',
  'fixedCosts.limit',
  'fixedCosts.couldNotSave',
  'fixedCosts.addTitle',
  'fixedCosts.editTitle',
  'fixedCosts.edit',
  'fixedCosts.close',
  'fixedCosts.nameLabel',
  'fixedCosts.namePlaceholder',
  'fixedCosts.amountLabel',
  'fixedCosts.amountDescription',
  'fixedCosts.lastPaymentLabel',
  'fixedCosts.lastPaymentHint',
  'fixedCosts.firstPaymentLabel',
  'fixedCosts.firstPaymentHint',
  'fixedCosts.paidAndLeft',
  'fixedCosts.leftToPay',
  'fixedCosts.paidSoFar',
  'fixedCosts.paidInTotal',
  'fixedCosts.paidShare',
  'fixedCosts.loans',
  'fixedCosts.loansPaid',
  'fixedCosts.month',
  'fixedCosts.year',
  'fixedCosts.save',
  'fixedCosts.delete',
  'fixedCosts.deleteTitle',
  'fixedCosts.deleteDescription',
  'fixedCosts.keep',
  'validation.costName',
  'validation.costAmount',
  'validation.lastPayment',
  'validation.lastPaymentPast',
  'validation.firstPaymentAfterLast',
  'earnings.fixedCosts',
  'earnings.fixedCostsCovered',
  'earnings.fixedCostsAllCovered',
  'earnings.fixedCostsShare',
  'nav.bills',
  'bills.title',
  'bills.empty',
  'bills.add',
  'bills.addShort',
  'bills.average',
  'bills.perYear',
  'bills.left',
  'bills.shortNote',
  'bills.chartTitle',
  'bills.chartAverage',
  'bills.highest',
  'bills.lowest',
  'bills.readout',
  'bills.readoutEmpty',
  'bills.list',
  'bills.above',
  'bills.below',
  'bills.noRecent',
  'bills.limit',
  'bills.couldNotSave',
  'bills.addTitle',
  'bills.edit',
  'bills.namePlaceholder',
  'bills.monthLabel',
  'bills.amountLabel',
  'bills.replaces',
  'bills.history',
  'bills.noAmounts',
  'bills.removeAmount',
  'bills.deleteDescription',
  'earnings.costsWithBills',
  'earnings.costsWithBillsShare',
  'form.heading',
  'form.setupNote',
  'form.incomeLabel',
  'form.incomeDescription',
  'form.payFrequencyLabel',
  'form.workStartLabel',
  'form.workEndLabel',
  'form.workDaysLabel',
  'form.scheduleSummary',
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
  'validation.workStart',
  'validation.workEnd',
  'validation.workDays',
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
  'theme.system',
  'theme.light',
  'theme.dark',
] as const;

export type TranslationKey = (typeof translationKeys)[number];
export type Catalog = Record<TranslationKey, string>;

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
  'calculator.repeat.workday': 'Every workday',
  'calculator.repeat.weekly': 'Weekly',
  'calculator.repeat.monthly': 'Monthly',
  'calculator.repeat.yearly': 'Yearly',
  'price.workday': '{{price}} every workday',
  'price.weekly': '{{price}} a week',
  'price.monthly': '{{price}} a month',
  'price.yearly': '{{price}} a year',
  'calculator.overYear': 'Over a year: {{duration}}',
  'calculator.eachMonth': 'Each month: {{duration}}',
  'calculator.earnedToday': 'Earned by {{time}} today',
  'calculator.earnedTomorrow': 'Earned by {{time}} tomorrow',
  'calculator.earnedOn': 'Earned by {{day}} at {{time}}',
  'calculator.earnedDate': 'Earned by {{date}}',
  'nav.cost': 'Cost',
  'nav.earnings': 'Earnings',
  'earnings.title': 'How much do you earn?',
  'earnings.today': 'Earned today',
  'earnings.todayNote': 'Around the clock since midnight',
  'earnings.atWork': 'Earned at work today',
  'earnings.startsAt': 'Starts at {{time}}',
  'earnings.workingUntil': 'Working until {{time}}',
  'earnings.timeLeft': '{{duration}} left',
  'earnings.finishedAt': 'Finished at {{time}}',
  'earnings.dayOff': 'No work today',
  'earnings.month': 'Earned this month',
  'earnings.monthShare': '{{percentage}} of this month’s take home pay',
  'earnings.monthTotal': 'of {{total}}',
  'earnings.workdays': 'Workdays: {{done}} of {{total}}',
  'earnings.hideAmounts': 'Hide amounts',
  'earnings.showAmounts': 'Show amounts',
  'earnings.hiddenAmount': 'Hidden',
  'earnings.breakdown': 'Your take home pay, broken down',
  'earnings.period': 'Period',
  'earnings.aroundTheClock': 'Around the clock',
  'earnings.whileWorking': 'At work',
  'earnings.per.second': 'Per second',
  'earnings.per.minute': 'Per minute',
  'earnings.per.hour': 'Per hour',
  'earnings.per.day': 'Per day',
  'earnings.per.week': 'Per week',
  'earnings.per.month': 'Per month',
  'earnings.per.year': 'Per year',
  'nav.fixedCosts': 'Fixed costs',
  'fixedCosts.title': 'What do you pay each month?',
  'fixedCosts.empty':
    'Add what you pay every month, like rent, a mortgage, loans, or insurance. Affordi shows them in work time, along with what is left of your pay.',
  'fixedCosts.add': 'Add fixed cost',
  'fixedCosts.addShort': 'Add',
  'fixedCosts.total': 'Fixed costs each month',
  'fixedCosts.left': 'Left each month',
  'fixedCosts.short': 'Short each month',
  'fixedCosts.perDay': '{{amount}} per day',
  'fixedCosts.shortNote': 'Your fixed costs are more than your take home pay.',
  'fixedCosts.list': 'Your fixed costs',
  'fixedCosts.ofPay': '{{percentage}}% of your pay',
  'fixedCosts.share': '{{percentage}}%',
  'fixedCosts.lastPayment': 'Last payment: {{month}}',
  'fixedCosts.ended': 'Ended',
  'fixedCosts.limit': 'You can add up to {{count}} fixed costs.',
  'fixedCosts.couldNotSave': 'Fixed costs are available for this visit, but could not be saved.',
  'fixedCosts.addTitle': 'Add a fixed cost',
  'fixedCosts.editTitle': 'Edit fixed cost',
  'fixedCosts.edit': 'Edit {{name}}',
  'fixedCosts.close': 'Close',
  'fixedCosts.nameLabel': 'Name',
  'fixedCosts.namePlaceholder': 'Mortgage',
  'fixedCosts.amountLabel': 'Amount each month',
  'fixedCosts.amountDescription': 'Amount in {{currency}}.',
  'fixedCosts.lastPaymentLabel': 'Last payment',
  'fixedCosts.lastPaymentHint': 'Optional, for loans and other costs that end.',
  'fixedCosts.firstPaymentLabel': 'First payment',
  'fixedCosts.firstPaymentHint': 'Optional, to see how much is already paid.',
  'fixedCosts.paidAndLeft': '{{paid}} paid · {{left}} left',
  'fixedCosts.leftToPay': '{{amount}} left to pay',
  'fixedCosts.paidSoFar': '{{amount}} paid so far',
  'fixedCosts.paidInTotal': '{{amount}} paid in total',
  'fixedCosts.paidShare': '{{percentage}} paid',
  'fixedCosts.loans': 'Left to pay on loans',
  'fixedCosts.loansPaid': '{{paid}} of {{total}} paid',
  'fixedCosts.month': 'Month',
  'fixedCosts.year': 'Year',
  'fixedCosts.save': 'Save',
  'fixedCosts.delete': 'Delete',
  'fixedCosts.deleteTitle': 'Delete {{name}}?',
  'fixedCosts.deleteDescription': 'This removes it from this device.',
  'fixedCosts.keep': 'Keep',
  'validation.costName': 'Enter a name.',
  'validation.costAmount': 'Enter an amount greater than 0.',
  'validation.lastPayment': 'Choose a month and a year, or leave both empty.',
  'validation.lastPaymentPast': 'Choose this month or later.',
  'validation.firstPaymentAfterLast': 'Choose a month no later than the last payment.',
  'earnings.fixedCosts': 'Fixed costs this month',
  'earnings.fixedCostsCovered': 'Covered so far',
  'earnings.fixedCostsAllCovered': 'All covered',
  'earnings.fixedCostsShare': '{{percentage}} of this month’s fixed costs covered',
  'nav.bills': 'Bills',
  'bills.title': 'What do your bills cost?',
  'bills.empty':
    'Add bills that change from month to month, like electricity, water, or heating, and enter each month’s amount when it arrives. Affordi shows your average month in work time and how much of your pay it takes.',
  'bills.add': 'Add bill',
  'bills.addShort': 'Add',
  'bills.average': 'Bills in an average month',
  'bills.perYear': 'About {{amount}} a year',
  'bills.left': 'Left after fixed costs and bills',
  'bills.shortNote': 'Your fixed costs and bills are more than your take home pay.',
  'bills.chartTitle': 'Bills per month',
  'bills.chartAverage': 'Average {{amount}}',
  'bills.highest': 'Highest: {{month}}, {{amount}}',
  'bills.lowest': 'Lowest: {{month}}, {{amount}}',
  'bills.readout': '{{month}}: {{amount}}',
  'bills.readoutEmpty': '{{month}}: no amounts',
  'bills.list': 'Your bills',
  'bills.above': '{{percentage}} above average',
  'bills.below': '{{percentage}} below average',
  'bills.noRecent': 'No amounts in the last 12 months',
  'bills.limit': 'You can add up to {{count}} bills.',
  'bills.couldNotSave': 'Bills are available for this visit, but could not be saved.',
  'bills.addTitle': 'Add a bill',
  'bills.edit': 'Edit {{name}}',
  'bills.namePlaceholder': 'Electricity',
  'bills.monthLabel': 'Month',
  'bills.amountLabel': 'Amount',
  'bills.replaces': 'Saved for this month: {{amount}}. A new amount replaces it.',
  'bills.history': 'Amounts',
  'bills.noAmounts': 'No amounts yet.',
  'bills.removeAmount': 'Remove {{month}}',
  'bills.deleteDescription': 'This removes the bill and all its amounts from this device.',
  'earnings.costsWithBills': 'Fixed costs and bills this month',
  'earnings.costsWithBillsShare': '{{percentage}} of this month’s fixed costs and bills covered',
  'form.heading': 'Start with your income',
  'form.setupNote': 'One quick setup.',
  'form.incomeLabel': 'Take home income',
  'form.incomeDescription': 'Amount in {{currency}}, after tax.',
  'form.payFrequencyLabel': 'Pay frequency',
  'form.workStartLabel': 'Work starts',
  'form.workEndLabel': 'Work ends',
  'form.workDaysLabel': 'Work days',
  'form.scheduleSummary': '{{daily}} a day, {{weekly}} a week',
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
  'validation.workStart': 'Choose when work starts.',
  'validation.workEnd': 'Choose an end time later the same day.',
  'validation.workDays': 'Choose at least one work day.',
  'validation.currency': 'Choose a currency.',
  'validation.language': 'Choose a language.',
  'validation.theme': 'Choose an appearance.',
  'settings.title': 'Settings',
  'settings.close': 'Close settings',
  'settings.resetTitle': 'Reset settings?',
  'settings.resetDescription':
    'This removes your income details, fixed costs, and bills from this device.',
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
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
};

/** The languages loaded so far. English is always there and stands in for the others. */
const catalogs: Partial<Record<Locale, Catalog>> = { en: english };

const catalogLoaders: Record<Exclude<Locale, 'en'>, () => Promise<{ default: Catalog }>> = {
  de: () => import('./locales/de'),
  fr: () => import('./locales/fr'),
  it: () => import('./locales/it'),
  sr: () => import('./locales/sr'),
};

const localeListeners = new Set<() => void>();
let loadedLocales = 1;

/**
 * Loads a language's copy. Only English is part of the first screen; the others are small
 * files that load before the app first renders in them and are cached for offline use.
 */
export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === 'en' || catalogs[locale] !== undefined) return;
  const { default: catalog } = await catalogLoaders[locale]();
  if (catalogs[locale] !== undefined) return;
  catalogs[locale] = catalog;
  loadedLocales += 1;
  for (const listener of localeListeners) listener();
}

/** Calls back when a language finishes loading, for components that should then re-render. */
export function subscribeToLocales(onChange: () => void): () => void {
  localeListeners.add(onChange);
  return () => localeListeners.delete(onChange);
}

/** How many languages have loaded, which changes whenever another one does. */
export function loadedLocaleCount(): number {
  return loadedLocales;
}
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
};

const unitForms: Record<Exclude<Locale, 'sr'>, Record<DurationUnit, readonly [string, string]>> = {
  en: {
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    workday: ['day', 'days'],
    week: ['week', 'weeks'],
  },
  de: {
    minute: ['Minute', 'Minuten'],
    hour: ['Stunde', 'Stunden'],
    workday: ['Tag', 'Tage'],
    week: ['Woche', 'Wochen'],
  },
  fr: {
    minute: ['minute', 'minutes'],
    hour: ['heure', 'heures'],
    workday: ['jour', 'jours'],
    week: ['semaine', 'semaines'],
  },
  it: {
    minute: ['minuto', 'minuti'],
    hour: ['ora', 'ore'],
    workday: ['giorno', 'giorni'],
    week: ['settimana', 'settimane'],
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

/**
 * Short weekday names start every full name, so the visible chip text stays
 * part of the accessible name. Indexes follow `Date.getDay()`, Sunday first.
 */
const weekdayNames: Record<Locale, Record<'short' | 'long', readonly string[]>> = {
  en: {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  de: {
    short: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    long: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  },
  fr: {
    short: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
    long: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  },
  it: {
    short: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
    long: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
  },
  sr: {
    short: ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'],
    long: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'],
  },
};

/** Intl writes Serbian dates in Cyrillic unless asked for the Latin script Affordi uses. */
function intlLocale(locale: Locale): string {
  return locale === 'sr' ? 'sr-Latn' : locale;
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();
/** French and Italian write the first of the month as an ordinal. */
const firstDayForms: Partial<Record<Locale, string>> = { fr: '1er', it: '1°' };

/** A day and month, with the year when it is not the current one. */
function dateFor(locale: Locale, date: Date, withYear: boolean): string {
  const key = `${locale}|${withYear}`;
  let format = dateFormats.get(key);
  if (format === undefined) {
    format = new Intl.DateTimeFormat(intlLocale(locale), {
      day: 'numeric',
      month: 'long',
      ...(withYear ? { year: 'numeric' } : {}),
    });
    dateFormats.set(key, format);
  }

  const firstOfMonth = date.getDate() === 1 ? firstDayForms[locale] : undefined;
  return format
    .formatToParts(date)
    .map((part) => (part.type === 'day' && firstOfMonth !== undefined ? firstOfMonth : part.value))
    .join('');
}

const monthFormats = new Map<string, Intl.DateTimeFormat>();

type MonthForm = 'long' | 'long-year' | 'narrow';

/** A month name such as "March", with its year as "March 2049", or as an initial "M". */
function monthFor(locale: Locale, date: Date, form: MonthForm): string {
  const key = `${locale}|${form}`;
  let format = monthFormats.get(key);
  if (format === undefined) {
    format = new Intl.DateTimeFormat(intlLocale(locale), {
      month: form === 'narrow' ? 'narrow' : 'long',
      ...(form === 'long-year' ? { year: 'numeric' } : {}),
    });
    monthFormats.set(key, format);
  }
  return format.format(date);
}

const timeFormats = new Map<Locale, Intl.DateTimeFormat>();

function timeFor(locale: Locale, date: Date): string {
  let format = timeFormats.get(locale);
  if (format === undefined) {
    format = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
    timeFormats.set(locale, format);
  }
  return format.format(date);
}

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
  /** A weekday name for a `Date.getDay()` number, 0 for Sunday. */
  weekday(day: number, form: 'short' | 'long'): string;
  time(date: Date): string;
  date(date: Date, withYear: boolean): string;
  /** The month of a date, alone or with its year. */
  month(date: Date, withYear: boolean): string;
  /** The initial of a month, for chart labels. */
  monthInitial(date: Date): string;
  unit(value: number, unit: DurationUnit): string;
  duration(parts: readonly (DurationPart | string)[]): string;
  lessThanMinute(): string;
  moreThanWeeks(count: number): string;
  ofWork(duration: string): string;
}

/** Creates a small translator without runtime dependencies for components and domain formatters. */
export function createTranslator(requestedLocale?: string): Translator {
  const detected = detectLocale(requestedLocale);
  // Until a language has loaded, everything is in English rather than half translated.
  const locale = catalogs[detected] === undefined ? 'en' : detected;
  const catalog = catalogs[locale] ?? english;

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
    weekday: (day, form) => weekdayNames[locale][form][day] ?? '',
    time: (date) => timeFor(locale, date),
    date: (date, withYear) => dateFor(locale, date, withYear),
    month: (date, withYear) => monthFor(locale, date, withYear ? 'long-year' : 'long'),
    monthInitial: (date) => monthFor(locale, date, 'narrow'),
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
