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
  'fixedCosts.perWorkday',
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
  'earnings.fixedCosts',
  'earnings.fixedCostsCovered',
  'earnings.fixedCostsAllCovered',
  'earnings.fixedCostsShare',
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
  'fixedCosts.perWorkday': '{{amount}} per workday',
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
  'earnings.fixedCosts': 'Fixed costs this month',
  'earnings.fixedCostsCovered': 'Covered so far',
  'earnings.fixedCostsAllCovered': 'All covered',
  'earnings.fixedCostsShare': '{{percentage}} of this month’s fixed costs covered',
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
  'settings.resetDescription': 'This removes your income details and fixed costs from this device.',
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
  'calculator.repeat.workday': 'Jeden Arbeitstag',
  'calculator.repeat.weekly': 'Wöchentlich',
  'calculator.repeat.monthly': 'Monatlich',
  'calculator.repeat.yearly': 'Jährlich',
  'price.workday': '{{price}} pro Arbeitstag',
  'price.weekly': '{{price}} pro Woche',
  'price.monthly': '{{price}} pro Monat',
  'price.yearly': '{{price}} pro Jahr',
  'calculator.overYear': 'Aufs Jahr gerechnet: {{duration}}',
  'calculator.eachMonth': 'Pro Monat: {{duration}}',
  'calculator.earnedToday': 'Verdient bis heute um {{time}}',
  'calculator.earnedTomorrow': 'Verdient bis morgen um {{time}}',
  'calculator.earnedOn': 'Verdient bis {{day}} um {{time}}',
  'calculator.earnedDate': 'Verdient bis zum {{date}}',
  'nav.cost': 'Kosten',
  'nav.earnings': 'Verdienst',
  'earnings.title': 'Wie viel verdienst du?',
  'earnings.today': 'Heute verdient',
  'earnings.todayNote': 'Rund um die Uhr seit Mitternacht',
  'earnings.atWork': 'Heute bei der Arbeit verdient',
  'earnings.startsAt': 'Beginnt um {{time}}',
  'earnings.workingUntil': 'Arbeit bis {{time}}',
  'earnings.timeLeft': 'Noch {{duration}}',
  'earnings.finishedAt': 'Feierabend seit {{time}}',
  'earnings.dayOff': 'Heute arbeitsfrei',
  'earnings.month': 'Diesen Monat verdient',
  'earnings.monthShare': '{{percentage}} deines monatlichen Nettoeinkommens',
  'earnings.monthTotal': 'von {{total}}',
  'earnings.workdays': 'Arbeitstage: {{done}} von {{total}}',
  'earnings.hideAmounts': 'Beträge ausblenden',
  'earnings.showAmounts': 'Beträge anzeigen',
  'earnings.hiddenAmount': 'Ausgeblendet',
  'earnings.breakdown': 'Dein Nettoeinkommen, aufgeschlüsselt',
  'earnings.period': 'Zeitraum',
  'earnings.aroundTheClock': 'Rund um die Uhr',
  'earnings.whileWorking': 'Bei der Arbeit',
  'earnings.per.second': 'Pro Sekunde',
  'earnings.per.minute': 'Pro Minute',
  'earnings.per.hour': 'Pro Stunde',
  'earnings.per.day': 'Pro Tag',
  'earnings.per.week': 'Pro Woche',
  'earnings.per.month': 'Pro Monat',
  'earnings.per.year': 'Pro Jahr',
  'nav.fixedCosts': 'Fixkosten',
  'fixedCosts.title': 'Was zahlst du jeden Monat?',
  'fixedCosts.empty':
    'Trage ein, was du jeden Monat zahlst, etwa Miete, Hypothek, Kredite oder Versicherungen. Affordi zeigt sie in Arbeitszeit und was dir von deinem Einkommen bleibt.',
  'fixedCosts.add': 'Fixkosten hinzufügen',
  'fixedCosts.addShort': 'Hinzufügen',
  'fixedCosts.total': 'Fixkosten pro Monat',
  'fixedCosts.left': 'Bleibt jeden Monat',
  'fixedCosts.short': 'Fehlt jeden Monat',
  'fixedCosts.perWorkday': '{{amount}} pro Arbeitstag',
  'fixedCosts.shortNote': 'Deine Fixkosten sind höher als dein Nettoeinkommen.',
  'fixedCosts.list': 'Deine Fixkosten',
  'fixedCosts.ofPay': '{{percentage}} % deines Einkommens',
  'fixedCosts.share': '{{percentage}} %',
  'fixedCosts.lastPayment': 'Letzte Zahlung: {{month}}',
  'fixedCosts.ended': 'Beendet',
  'fixedCosts.limit': 'Du kannst bis zu {{count}} Fixkosten hinzufügen.',
  'fixedCosts.couldNotSave':
    'Die Fixkosten sind für diesen Besuch verfügbar, konnten aber nicht gespeichert werden.',
  'fixedCosts.addTitle': 'Fixkosten hinzufügen',
  'fixedCosts.editTitle': 'Fixkosten bearbeiten',
  'fixedCosts.edit': '{{name}} bearbeiten',
  'fixedCosts.close': 'Schließen',
  'fixedCosts.nameLabel': 'Name',
  'fixedCosts.namePlaceholder': 'Miete',
  'fixedCosts.amountLabel': 'Betrag pro Monat',
  'fixedCosts.amountDescription': 'Betrag in {{currency}}.',
  'fixedCosts.lastPaymentLabel': 'Letzte Zahlung',
  'fixedCosts.lastPaymentHint': 'Optional, für Kredite und andere Kosten mit Ende.',
  'fixedCosts.month': 'Monat',
  'fixedCosts.year': 'Jahr',
  'fixedCosts.save': 'Speichern',
  'fixedCosts.delete': 'Löschen',
  'fixedCosts.deleteTitle': '{{name}} löschen?',
  'fixedCosts.deleteDescription': 'Der Eintrag wird von diesem Gerät entfernt.',
  'fixedCosts.keep': 'Behalten',
  'validation.costName': 'Gib einen Namen ein.',
  'validation.costAmount': 'Gib einen Betrag über 0 ein.',
  'validation.lastPayment': 'Wähle Monat und Jahr oder lass beides leer.',
  'validation.lastPaymentPast': 'Wähle diesen Monat oder später.',
  'earnings.fixedCosts': 'Fixkosten diesen Monat',
  'earnings.fixedCostsCovered': 'Bisher gedeckt',
  'earnings.fixedCostsAllCovered': 'Alles gedeckt',
  'earnings.fixedCostsShare': '{{percentage}} der Fixkosten dieses Monats gedeckt',
  'form.heading': 'Beginne mit deinem Einkommen',
  'form.setupNote': 'Eine kurze Einrichtung.',
  'form.incomeLabel': 'Nettoeinkommen',
  'form.incomeDescription': 'Betrag in {{currency}}, nach Steuern.',
  'form.payFrequencyLabel': 'Zahlungsrhythmus',
  'form.workStartLabel': 'Arbeitsbeginn',
  'form.workEndLabel': 'Arbeitsende',
  'form.workDaysLabel': 'Arbeitstage',
  'form.scheduleSummary': '{{daily}} pro Tag, {{weekly}} pro Woche',
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
  'validation.workStart': 'Wähle, wann die Arbeit beginnt.',
  'validation.workEnd': 'Wähle ein Ende später am selben Tag.',
  'validation.workDays': 'Wähle mindestens einen Arbeitstag.',
  'validation.currency': 'Wähle eine Währung.',
  'validation.language': 'Wähle eine Sprache.',
  'validation.theme': 'Wähle eine Darstellung.',
  'settings.title': 'Einstellungen',
  'settings.close': 'Einstellungen schließen',
  'settings.resetTitle': 'Einstellungen zurücksetzen?',
  'settings.resetDescription':
    'Deine Einkommensdaten und Fixkosten werden von diesem Gerät entfernt.',
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
  'calculator.repeat.workday': 'Chaque jour travaillé',
  'calculator.repeat.weekly': 'Par semaine',
  'calculator.repeat.monthly': 'Par mois',
  'calculator.repeat.yearly': 'Par an',
  'price.workday': '{{price}} par jour travaillé',
  'price.weekly': '{{price}} par semaine',
  'price.monthly': '{{price}} par mois',
  'price.yearly': '{{price}} par an',
  'calculator.overYear': 'Sur un an : {{duration}}',
  'calculator.eachMonth': 'Par mois : {{duration}}',
  'calculator.earnedToday': 'Gagné aujourd’hui à {{time}}',
  'calculator.earnedTomorrow': 'Gagné demain à {{time}}',
  'calculator.earnedOn': 'Gagné {{day}} à {{time}}',
  'calculator.earnedDate': 'Gagné le {{date}}',
  'nav.cost': 'Coût',
  'nav.earnings': 'Revenus',
  'earnings.title': 'Combien gagnez-vous ?',
  'earnings.today': 'Gagné aujourd’hui',
  'earnings.todayNote': '24 h sur 24 depuis minuit',
  'earnings.atWork': 'Gagné au travail aujourd’hui',
  'earnings.startsAt': 'Commence à {{time}}',
  'earnings.workingUntil': 'Au travail jusqu’à {{time}}',
  'earnings.timeLeft': 'Encore {{duration}}',
  'earnings.finishedAt': 'Terminé à {{time}}',
  'earnings.dayOff': 'Pas de travail aujourd’hui',
  'earnings.month': 'Gagné ce mois-ci',
  'earnings.monthShare': '{{percentage}} de votre revenu net du mois',
  'earnings.monthTotal': 'sur {{total}}',
  'earnings.workdays': 'Jours travaillés : {{done}} sur {{total}}',
  'earnings.hideAmounts': 'Masquer les montants',
  'earnings.showAmounts': 'Afficher les montants',
  'earnings.hiddenAmount': 'Masqué',
  'earnings.breakdown': 'Votre revenu net, en détail',
  'earnings.period': 'Période',
  'earnings.aroundTheClock': '24 h sur 24',
  'earnings.whileWorking': 'Au travail',
  'earnings.per.second': 'Par seconde',
  'earnings.per.minute': 'Par minute',
  'earnings.per.hour': 'Par heure',
  'earnings.per.day': 'Par jour',
  'earnings.per.week': 'Par semaine',
  'earnings.per.month': 'Par mois',
  'earnings.per.year': 'Par an',
  'nav.fixedCosts': 'Charges',
  'fixedCosts.title': 'Que payez-vous chaque mois ?',
  'fixedCosts.empty':
    'Ajoutez ce que vous payez chaque mois, comme le loyer, un crédit immobilier, des prêts ou des assurances. Affordi les montre en temps de travail, avec ce qu’il vous reste de votre revenu.',
  'fixedCosts.add': 'Ajouter une charge',
  'fixedCosts.addShort': 'Ajouter',
  'fixedCosts.total': 'Charges fixes par mois',
  'fixedCosts.left': 'Reste chaque mois',
  'fixedCosts.short': 'Manque chaque mois',
  'fixedCosts.perWorkday': '{{amount}} par jour travaillé',
  'fixedCosts.shortNote': 'Vos charges fixes dépassent votre revenu net.',
  'fixedCosts.list': 'Vos charges fixes',
  'fixedCosts.ofPay': '{{percentage}} % de votre revenu',
  'fixedCosts.share': '{{percentage}} %',
  'fixedCosts.lastPayment': 'Dernier paiement : {{month}}',
  'fixedCosts.ended': 'Terminée',
  'fixedCosts.limit': 'Vous pouvez ajouter jusqu’à {{count}} charges fixes.',
  'fixedCosts.couldNotSave':
    'Les charges fixes sont disponibles pour cette visite, mais n’ont pas pu être enregistrées.',
  'fixedCosts.addTitle': 'Ajouter une charge fixe',
  'fixedCosts.editTitle': 'Modifier la charge fixe',
  'fixedCosts.edit': 'Modifier {{name}}',
  'fixedCosts.close': 'Fermer',
  'fixedCosts.nameLabel': 'Nom',
  'fixedCosts.namePlaceholder': 'Loyer',
  'fixedCosts.amountLabel': 'Montant par mois',
  'fixedCosts.amountDescription': 'Montant en {{currency}}.',
  'fixedCosts.lastPaymentLabel': 'Dernier paiement',
  'fixedCosts.lastPaymentHint': 'Facultatif, pour les prêts et autres charges qui prennent fin.',
  'fixedCosts.month': 'Mois',
  'fixedCosts.year': 'Année',
  'fixedCosts.save': 'Enregistrer',
  'fixedCosts.delete': 'Supprimer',
  'fixedCosts.deleteTitle': 'Supprimer {{name}} ?',
  'fixedCosts.deleteDescription': 'Cette charge sera supprimée de cet appareil.',
  'fixedCosts.keep': 'Garder',
  'validation.costName': 'Saisissez un nom.',
  'validation.costAmount': 'Saisissez un montant supérieur à 0.',
  'validation.lastPayment': 'Choisissez un mois et une année, ou laissez les deux vides.',
  'validation.lastPaymentPast': 'Choisissez ce mois-ci ou plus tard.',
  'earnings.fixedCosts': 'Charges fixes ce mois-ci',
  'earnings.fixedCostsCovered': 'Couvert jusqu’ici',
  'earnings.fixedCostsAllCovered': 'Tout est couvert',
  'earnings.fixedCostsShare': '{{percentage}} des charges fixes du mois couverts',
  'form.heading': 'Commencez par vos revenus',
  'form.setupNote': 'Une configuration rapide.',
  'form.incomeLabel': 'Revenu net',
  'form.incomeDescription': 'Montant en {{currency}}, après impôts.',
  'form.payFrequencyLabel': 'Fréquence de paiement',
  'form.workStartLabel': 'Début du travail',
  'form.workEndLabel': 'Fin du travail',
  'form.workDaysLabel': 'Jours travaillés',
  'form.scheduleSummary': '{{daily}} par jour, {{weekly}} par semaine',
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
  'validation.workStart': 'Choisissez l’heure de début du travail.',
  'validation.workEnd': 'Choisissez une heure de fin plus tard le même jour.',
  'validation.workDays': 'Choisissez au moins un jour travaillé.',
  'validation.currency': 'Choisissez une devise.',
  'validation.language': 'Choisissez une langue.',
  'validation.theme': 'Choisissez une apparence.',
  'settings.title': 'Réglages',
  'settings.close': 'Fermer les réglages',
  'settings.resetTitle': 'Réinitialiser les réglages ?',
  'settings.resetDescription':
    'Vos informations de revenus et vos charges fixes seront supprimées de cet appareil.',
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
  'calculator.repeat.workday': 'Ogni giorno lavorativo',
  'calculator.repeat.weekly': 'A settimana',
  'calculator.repeat.monthly': 'Al mese',
  'calculator.repeat.yearly': 'All’anno',
  'price.workday': '{{price}} per giorno lavorativo',
  'price.weekly': '{{price}} a settimana',
  'price.monthly': '{{price}} al mese',
  'price.yearly': '{{price}} all’anno',
  'calculator.overYear': 'In un anno: {{duration}}',
  'calculator.eachMonth': 'Al mese: {{duration}}',
  'calculator.earnedToday': 'Guadagnato oggi alle {{time}}',
  'calculator.earnedTomorrow': 'Guadagnato domani alle {{time}}',
  'calculator.earnedOn': 'Guadagnato {{day}} alle {{time}}',
  'calculator.earnedDate': 'Guadagnato il {{date}}',
  'nav.cost': 'Costo',
  'nav.earnings': 'Guadagni',
  'earnings.title': 'Quanto guadagni?',
  'earnings.today': 'Guadagnato oggi',
  'earnings.todayNote': '24 ore su 24 da mezzanotte',
  'earnings.atWork': 'Guadagnato al lavoro oggi',
  'earnings.startsAt': 'Inizia alle {{time}}',
  'earnings.workingUntil': 'Al lavoro fino alle {{time}}',
  'earnings.timeLeft': 'Ancora {{duration}}',
  'earnings.finishedAt': 'Finito alle {{time}}',
  'earnings.dayOff': 'Oggi niente lavoro',
  'earnings.month': 'Guadagnato questo mese',
  'earnings.monthShare': '{{percentage}} dello stipendio netto del mese',
  'earnings.monthTotal': 'su {{total}}',
  'earnings.workdays': 'Giorni lavorativi: {{done}} su {{total}}',
  'earnings.hideAmounts': 'Nascondi importi',
  'earnings.showAmounts': 'Mostra importi',
  'earnings.hiddenAmount': 'Nascosto',
  'earnings.breakdown': 'Il tuo stipendio netto, nel dettaglio',
  'earnings.period': 'Periodo',
  'earnings.aroundTheClock': '24 ore su 24',
  'earnings.whileWorking': 'Al lavoro',
  'earnings.per.second': 'Al secondo',
  'earnings.per.minute': 'Al minuto',
  'earnings.per.hour': 'All’ora',
  'earnings.per.day': 'Al giorno',
  'earnings.per.week': 'A settimana',
  'earnings.per.month': 'Al mese',
  'earnings.per.year': 'All’anno',
  'nav.fixedCosts': 'Spese fisse',
  'fixedCosts.title': 'Cosa paghi ogni mese?',
  'fixedCosts.empty':
    'Aggiungi ciò che paghi ogni mese, come affitto, mutuo, prestiti o assicurazioni. Affordi le mostra in tempo di lavoro, con quanto ti resta dello stipendio.',
  'fixedCosts.add': 'Aggiungi spesa',
  'fixedCosts.addShort': 'Aggiungi',
  'fixedCosts.total': 'Spese fisse al mese',
  'fixedCosts.left': 'Ti resta ogni mese',
  'fixedCosts.short': 'Ti manca ogni mese',
  'fixedCosts.perWorkday': '{{amount}} per giorno lavorativo',
  'fixedCosts.shortNote': 'Le tue spese fisse superano il tuo stipendio netto.',
  'fixedCosts.list': 'Le tue spese fisse',
  'fixedCosts.ofPay': '{{percentage}}% del tuo stipendio',
  'fixedCosts.share': '{{percentage}}%',
  'fixedCosts.lastPayment': 'Ultimo pagamento: {{month}}',
  'fixedCosts.ended': 'Terminata',
  'fixedCosts.limit': 'Puoi aggiungere fino a {{count}} spese fisse.',
  'fixedCosts.couldNotSave':
    'Le spese fisse sono disponibili per questa visita, ma non è stato possibile salvarle.',
  'fixedCosts.addTitle': 'Aggiungi una spesa fissa',
  'fixedCosts.editTitle': 'Modifica spesa fissa',
  'fixedCosts.edit': 'Modifica {{name}}',
  'fixedCosts.close': 'Chiudi',
  'fixedCosts.nameLabel': 'Nome',
  'fixedCosts.namePlaceholder': 'Mutuo',
  'fixedCosts.amountLabel': 'Importo al mese',
  'fixedCosts.amountDescription': 'Importo in {{currency}}.',
  'fixedCosts.lastPaymentLabel': 'Ultimo pagamento',
  'fixedCosts.lastPaymentHint': 'Facoltativo, per prestiti e altre spese che finiscono.',
  'fixedCosts.month': 'Mese',
  'fixedCosts.year': 'Anno',
  'fixedCosts.save': 'Salva',
  'fixedCosts.delete': 'Elimina',
  'fixedCosts.deleteTitle': 'Eliminare {{name}}?',
  'fixedCosts.deleteDescription': 'Verrà rimossa da questo dispositivo.',
  'fixedCosts.keep': 'Mantieni',
  'validation.costName': 'Inserisci un nome.',
  'validation.costAmount': 'Inserisci un importo maggiore di 0.',
  'validation.lastPayment': 'Scegli un mese e un anno, oppure lascia vuoti entrambi.',
  'validation.lastPaymentPast': 'Scegli questo mese o uno successivo.',
  'earnings.fixedCosts': 'Spese fisse di questo mese',
  'earnings.fixedCostsCovered': 'Coperto finora',
  'earnings.fixedCostsAllCovered': 'Tutto coperto',
  'earnings.fixedCostsShare': '{{percentage}} delle spese fisse del mese coperte',
  'form.heading': 'Inizia dal tuo reddito',
  'form.setupNote': 'Una configurazione rapida.',
  'form.incomeLabel': 'Reddito netto',
  'form.incomeDescription': 'Importo in {{currency}}, dopo le tasse.',
  'form.payFrequencyLabel': 'Frequenza di pagamento',
  'form.workStartLabel': 'Inizio lavoro',
  'form.workEndLabel': 'Fine lavoro',
  'form.workDaysLabel': 'Giorni lavorativi',
  'form.scheduleSummary': '{{daily}} al giorno, {{weekly}} a settimana',
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
  'validation.workStart': 'Scegli quando inizia il lavoro.',
  'validation.workEnd': 'Scegli un orario di fine più tardi nello stesso giorno.',
  'validation.workDays': 'Scegli almeno un giorno lavorativo.',
  'validation.currency': 'Scegli una valuta.',
  'validation.language': 'Scegli una lingua.',
  'validation.theme': 'Scegli un aspetto.',
  'settings.title': 'Impostazioni',
  'settings.close': 'Chiudi impostazioni',
  'settings.resetTitle': 'Reimpostare le impostazioni?',
  'settings.resetDescription':
    'I dati sul reddito e le spese fisse verranno rimossi da questo dispositivo.',
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
  'calculator.repeat.workday': 'Svakog radnog dana',
  'calculator.repeat.weekly': 'Nedeljno',
  'calculator.repeat.monthly': 'Mesečno',
  'calculator.repeat.yearly': 'Godišnje',
  'price.workday': '{{price}} po radnom danu',
  'price.weekly': '{{price}} nedeljno',
  'price.monthly': '{{price}} mesečno',
  'price.yearly': '{{price}} godišnje',
  'calculator.overYear': 'Za godinu dana: {{duration}}',
  'calculator.eachMonth': 'Mesečno: {{duration}}',
  'calculator.earnedToday': 'Zarađeno danas u {{time}}',
  'calculator.earnedTomorrow': 'Zarađeno sutra u {{time}}',
  'calculator.earnedOn': 'Zarađeno: {{day}}, {{time}}',
  'calculator.earnedDate': 'Zarađeno: {{date}}',
  'nav.cost': 'Trošak',
  'nav.earnings': 'Zarada',
  'earnings.title': 'Koliko zarađujete?',
  'earnings.today': 'Zarađeno danas',
  'earnings.todayNote': 'Danonoćno od ponoći',
  'earnings.atWork': 'Zarađeno danas na poslu',
  'earnings.startsAt': 'Počinje u {{time}}',
  'earnings.workingUntil': 'Radite do {{time}}',
  'earnings.timeLeft': 'Još {{duration}}',
  'earnings.finishedAt': 'Završeno u {{time}}',
  'earnings.dayOff': 'Danas je slobodan dan',
  'earnings.month': 'Zarađeno ovog meseca',
  'earnings.monthShare': '{{percentage}} neto plate za ovaj mesec',
  'earnings.monthTotal': 'od {{total}}',
  'earnings.workdays': 'Radni dani: {{done}} od {{total}}',
  'earnings.hideAmounts': 'Sakrij iznose',
  'earnings.showAmounts': 'Prikaži iznose',
  'earnings.hiddenAmount': 'Sakriveno',
  'earnings.breakdown': 'Vaša neto plata po vremenu',
  'earnings.period': 'Period',
  'earnings.aroundTheClock': 'Danonoćno',
  'earnings.whileWorking': 'Na poslu',
  'earnings.per.second': 'Po sekundi',
  'earnings.per.minute': 'Po minutu',
  'earnings.per.hour': 'Po satu',
  'earnings.per.day': 'Po danu',
  'earnings.per.week': 'Nedeljno',
  'earnings.per.month': 'Mesečno',
  'earnings.per.year': 'Godišnje',
  'nav.fixedCosts': 'Obaveze',
  'fixedCosts.title': 'Šta plaćate svakog meseca?',
  'fixedCosts.empty':
    'Dodajte ono što plaćate svakog meseca, kao što su kirija, stambeni kredit, krediti ili osiguranje. Affordi ih prikazuje u radnom vremenu, uz to koliko vam ostaje od plate.',
  'fixedCosts.add': 'Dodaj obavezu',
  'fixedCosts.addShort': 'Dodaj',
  'fixedCosts.total': 'Fiksni troškovi mesečno',
  'fixedCosts.left': 'Ostaje svakog meseca',
  'fixedCosts.short': 'Nedostaje svakog meseca',
  'fixedCosts.perWorkday': '{{amount}} po radnom danu',
  'fixedCosts.shortNote': 'Vaši fiksni troškovi su veći od vaše neto plate.',
  'fixedCosts.list': 'Vaše obaveze',
  'fixedCosts.ofPay': '{{percentage}}% vaše plate',
  'fixedCosts.share': '{{percentage}}%',
  'fixedCosts.lastPayment': 'Poslednja uplata: {{month}}',
  'fixedCosts.ended': 'Završeno',
  'fixedCosts.limit': 'Možete dodati najviše {{count}} obaveza.',
  'fixedCosts.couldNotSave': 'Obaveze su dostupne za ovu posetu, ali nisu mogle da budu sačuvane.',
  'fixedCosts.addTitle': 'Dodaj obavezu',
  'fixedCosts.editTitle': 'Izmeni obavezu',
  'fixedCosts.edit': 'Izmeni: {{name}}',
  'fixedCosts.close': 'Zatvori',
  'fixedCosts.nameLabel': 'Naziv',
  'fixedCosts.namePlaceholder': 'Kirija',
  'fixedCosts.amountLabel': 'Iznos mesečno',
  'fixedCosts.amountDescription': 'Iznos u valuti {{currency}}.',
  'fixedCosts.lastPaymentLabel': 'Poslednja uplata',
  'fixedCosts.lastPaymentHint': 'Opciono, za kredite i druge obaveze koje se završavaju.',
  'fixedCosts.month': 'Mesec',
  'fixedCosts.year': 'Godina',
  'fixedCosts.save': 'Sačuvaj',
  'fixedCosts.delete': 'Obriši',
  'fixedCosts.deleteTitle': 'Obrisati: {{name}}?',
  'fixedCosts.deleteDescription': 'Biće uklonjeno sa ovog uređaja.',
  'fixedCosts.keep': 'Zadrži',
  'validation.costName': 'Unesite naziv.',
  'validation.costAmount': 'Unesite iznos veći od 0.',
  'validation.lastPayment': 'Izaberite mesec i godinu ili ostavite oba prazna.',
  'validation.lastPaymentPast': 'Izaberite ovaj ili neki kasniji mesec.',
  'earnings.fixedCosts': 'Obaveze ovog meseca',
  'earnings.fixedCostsCovered': 'Pokriveno do sada',
  'earnings.fixedCostsAllCovered': 'Sve je pokriveno',
  'earnings.fixedCostsShare': 'Pokriveno {{percentage}} obaveza za ovaj mesec',
  'form.heading': 'Počnite od svojih prihoda',
  'form.setupNote': 'Brzo početno podešavanje.',
  'form.incomeLabel': 'Neto prihod',
  'form.incomeDescription': 'Iznos u valuti {{currency}}, posle poreza.',
  'form.payFrequencyLabel': 'Učestalost isplate',
  'form.workStartLabel': 'Početak rada',
  'form.workEndLabel': 'Kraj rada',
  'form.workDaysLabel': 'Radni dani',
  'form.scheduleSummary': '{{daily}} dnevno, {{weekly}} nedeljno',
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
  'validation.workStart': 'Izaberite kada počinje rad.',
  'validation.workEnd': 'Izaberite vreme završetka kasnije istog dana.',
  'validation.workDays': 'Izaberite bar jedan radni dan.',
  'validation.currency': 'Izaberite valutu.',
  'validation.language': 'Izaberite jezik.',
  'validation.theme': 'Izaberite izgled.',
  'settings.title': 'Podešavanja',
  'settings.close': 'Zatvori podešavanja',
  'settings.resetTitle': 'Resetovati podešavanja?',
  'settings.resetDescription': 'Podaci o prihodima i obaveze biće uklonjeni sa ovog uređaja.',
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

/** A month name, alone or with its year, such as "March" or "March 2049". */
function monthFor(locale: Locale, date: Date, withYear: boolean): string {
  const key = `${locale}|${withYear}`;
  let format = monthFormats.get(key);
  if (format === undefined) {
    format = new Intl.DateTimeFormat(intlLocale(locale), {
      month: 'long',
      ...(withYear ? { year: 'numeric' } : {}),
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
    weekday: (day, form) => weekdayNames[locale][form][day] ?? '',
    time: (date) => timeFor(locale, date),
    date: (date, withYear) => dateFor(locale, date, withYear),
    month: (date, withYear) => monthFor(locale, date, withYear),
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
