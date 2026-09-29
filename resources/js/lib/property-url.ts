import { ordinal } from '@/lib/ordinal';

/** Slug of an arrondissement's listing page: « paris-6e » / « paris-6th » (as `DistrictSlug::make`). */
export const districtSlug = (arrondissement: number, locale: string): string => `paris-${ordinal(arrondissement, locale)}`;

/** Translated transaction segment of the detail URL (as `routes.transaction_sale` / `_rent`, mirrored in `PropertyUrl`). */
export const transactionSegment = (transaction: 'sale' | 'rent', locale: string): string =>
    locale.startsWith('fr') ? (transaction === 'rent' ? 'location' : 'achat') : transaction === 'rent' ? 'rent' : 'buy';

/**
 * Detail URL of a listing (SEO decisions 2026-09-28 / 29): the transaction, the arrondissement, the slug —
 * `/nos-biens/achat/paris-6e/{slug}` ↔ `/en/properties/buy/paris-6th/{slug}` — the one place the front builds it
 * (as `PropertyUrl` server side).
 */
export const propertyUrl = (property: { transaction: 'sale' | 'rent'; arrondissement: number; slug: string }, locale: string): string =>
    route('properties.show', {
        transaction: transactionSegment(property.transaction, locale),
        district: districtSlug(property.arrondissement, locale),
        slug: property.slug,
    });
