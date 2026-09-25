import { ordinal } from '@/lib/ordinal';
import { describe, expect, it } from 'vitest';

describe('ordinal', () => {
    it('writes French and English ordinals', () => {
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n) => ordinal(n, 'en'))).toEqual([
            '1st',
            '2nd',
            '3rd',
            '4th',
            '11th',
            '12th',
            '13th',
            '21st',
            '22nd',
            '23rd',
            '101st',
        ]);
        expect([1, 2, 20].map((n) => ordinal(n, 'fr'))).toEqual(['1er', '2e', '20e']);
    });
});
