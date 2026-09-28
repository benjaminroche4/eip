import { formatPrice, groupThousands } from '@/lib/format-price';
import { describe, expect, it } from 'vitest';

/** The one price format of the site (2026-09-28): cards, mini card, map chips and the typed budget share it. */
describe('format-price', () => {
    it('groups the thousands of a typed amount in the language, keeping only its digits', () => {
        expect(groupThousands('1500000', 'fr')).toBe('1 500 000');
        expect(groupThousands('1 500 000 €', 'fr')).toBe('1 500 000');
        expect(groupThousands('1500000', 'en')).toBe('1,500,000');
        expect(groupThousands('abc', 'fr')).toBe('');
    });

    it('formats a price with its currency where the language puts it, rounding fractions (price per m²)', () => {
        expect(formatPrice(2450000, 'fr')).toBe('2 450 000 €');
        expect(formatPrice(2450000, 'en')).toBe('€2,450,000');
        expect(formatPrice(6500, 'fr')).toBe('6 500 €');
        expect(formatPrice(2450000 / 128, 'fr')).toBe('19 141 €');
        expect(formatPrice(999, 'en')).toBe('€999');
    });
});
