import { parseFaqMarkup, stripFaqMarkup } from '@/lib/faq-markup';
import { describe, expect, it } from 'vitest';

describe('faq-markup', () => {
    it('splits text and [label](route) links', () => {
        expect(parseFaqMarkup('Par le [formulaire](contact), ou par [la newsletter](newsletter).')).toEqual([
            { type: 'text', value: 'Par le ' },
            { type: 'link', value: 'formulaire', route: 'contact' },
            { type: 'text', value: ', ou par ' },
            { type: 'link', value: 'la newsletter', route: 'newsletter' },
            { type: 'text', value: '.' },
        ]);
        expect(parseFaqMarkup('Sans lien.')).toEqual([{ type: 'text', value: 'Sans lien.' }]);
    });

    it('strips the markup for JSON-LD and search', () => {
        expect(stripFaqMarkup('Par le [formulaire](contact).')).toBe('Par le formulaire.');
    });
});
