/** Keeps the digits of a typed amount and groups the thousands like the site's prices (« 1 500 000 » in French, « 1,500,000 » in English). */
export const groupThousands = (value: string, locale: string): string =>
    value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'fr' ? ' ' : ',');

/**
 * A price in the language's format, the one function for every amount of the site (`districts.price_format` mirrors it
 * in `ui.php` for the arrondissement cards): « 2 450 000 € » in French, « €2,450,000 » in English (2026-09-28: the
 * property cards, the mini card and the map chips each grouped the digits with their own regex).
 */
export const formatPrice = (amount: number, locale: string): string => {
    const grouped = groupThousands(String(Math.round(amount)), locale);
    return locale === 'fr' ? `${grouped} €` : `€${grouped}`;
};
