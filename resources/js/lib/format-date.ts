type DateStyle = 'long' | 'short';

/**
 * "12 mars 2026" / "March 12, 2026" (long) or "12 mars 2026" / "12 Mar 2026" (short: abbreviated month).
 * Deterministic between SSR and client (no timezone drift on ISO dates).
 */
export function formatDate(iso: string, locale: string, style: DateStyle = 'long'): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: style, year: 'numeric', timeZone: 'UTC' }).format(date);
}
