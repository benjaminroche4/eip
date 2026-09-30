import { realEstateListings } from '@/lib/json-ld';
import { describe, expect, it } from 'vitest';

const LISTING = {
    slug: 'appartement-passy',
    title: 'Appartement Art déco, Passy',
    excerpt: 'Immeuble de standing avec gardien.',
    type: 'apartment',
    transaction: 'sale' as const,
    price: 1_890_000,
    surface: 142,
    rooms: 5,
    bedrooms: 3,
    arrondissement: 16,
    photos: ['/images/buy/district-4-{w}.webp'],
    available: true,
    lat: 48.8575,
    lng: 2.279,
    published_at: '2026-09-25',
    year_built: 1931,
    floor: 4,
    price_history: [
        { date: '2026-09-25', price: 1_950_000 },
        { date: '2026-09-28', price: 1_890_000 },
    ],
    url: 'https://example.test/nos-biens/achat/paris-16e/appartement-passy',
};
const AGENCY = { name: 'Estate in Paris', url: 'https://example.test' };

/** `RealEstateListing` entities (SEO audit 2026-09-30): the listing's own URL, the agency as provider, dated and detailed. */
describe('realEstateListings', () => {
    it('on the listing page, links each entity to its detail page and names the agency', () => {
        const [node] = realEstateListings([LISTING], 'https://example.test', 'https://example.test/nos-biens', 'fr', false, AGENCY);
        expect(node).toMatchObject({
            '@type': 'RealEstateListing',
            '@id': LISTING.url,
            url: LISTING.url,
            datePosted: '2026-09-25',
            dateModified: '2026-09-28', // the last price change
            provider: { '@type': 'RealEstateAgent', name: 'Estate in Paris', url: 'https://example.test' },
            offers: { '@type': 'Offer', url: LISTING.url, price: 1_890_000, priceCurrency: 'EUR' },
            about: { '@type': 'Apartment', yearBuilt: 1931, floorLevel: '4', address: { postalCode: '75016' } },
        });
        expect(node).not.toHaveProperty('mainEntityOfPage');
    });

    it('standalone (detail page), the listing is the page; without a url it falls back to the anchor; confidential ones are left out', () => {
        const [node] = realEstateListings([LISTING], 'https://example.test', LISTING.url, 'fr', true, AGENCY);
        expect(node).toMatchObject({ '@id': LISTING.url, mainEntityOfPage: LISTING.url, offers: { url: LISTING.url } });
        const { url: _url, ...anchored } = LISTING;
        void _url;
        expect(realEstateListings([anchored], 'https://example.test', 'https://example.test/nos-biens', 'fr')[0]).toMatchObject({
            '@id': 'https://example.test/nos-biens#appartement-passy',
        });
        expect(realEstateListings([{ ...LISTING, off_market: true }], 'https://example.test', 'https://example.test/nos-biens', 'fr')).toHaveLength(
            0,
        );
    });
});
