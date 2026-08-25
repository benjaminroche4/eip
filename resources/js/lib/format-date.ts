/** "12 mars 2026" / "March 12, 2026" — deterministic between SSR and client (no timezone drift on ISO dates). */
export function formatDate(iso: string, locale: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
