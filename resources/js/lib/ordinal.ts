/** « 1er » / « 2e » in French, « 1st » / « 2nd » / « 3rd » / « 4th » in English (the site's two languages). */
export function ordinal(n: number, locale: string): string {
    if (locale.startsWith('fr')) return n === 1 ? '1er' : `${n}e`;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
    return `${n}${suffix}`;
}
