import { type Property } from '@/components/properties/property-card';

/** One sale of the sample, as `Property::toArray()` sends it. */
export const PROPERTY: Property = {
    slug: 'appartement-saint-germain-des-pres-6e',
    title: 'Appartement haussmannien, Saint-Germain-des-Prés',
    arrondissement: 6,
    area: 'Saint-Germain-des-Prés',
    type: 'apartment',
    transaction: 'sale',
    price: 2450000,
    surface: 128,
    rooms: 4,
    bedrooms: 2,
    excerpt: 'Étage noble, parquet, moulures et cheminées.',
    photos: ['/images/buy/district-1-{w}.webp', '/images/buy/district-2-{w}.webp', '/images/buy/district-3-{w}.webp'],
    photo_alt: 'Salon haussmannien lumineux',
    advisor: 1,
    available: true,
    lat: 48.8539,
    lng: 2.3338,
};
