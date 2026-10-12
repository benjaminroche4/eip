/** BCP 47 tag for `toLocaleString` from the site locale (`fr` → French grouping « 1 250 », « 4,9 »; `en` → « 1,250 », « 4.9 »). */
export const numberLocale = (locale: string): string => (locale === 'en' ? 'en-GB' : 'fr-FR');

/** A number written in the page's language (audit 2026-10-12: « 4,9 » used to show on English pages). */
export const formatNumber = (value: number, locale: string, options?: Intl.NumberFormatOptions): string =>
    value.toLocaleString(numberLocale(locale), options);
