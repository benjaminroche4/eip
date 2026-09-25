import BuyDistricts, { type BuyDistrict } from '@/components/buy/buy-districts';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: BuyDistrict[] = [
    {
        name: 'Paris 6e',
        area: 'Saint-Germain-des-Prés',
        text: 'Élégance intemporelle.',
        price: '≈ 14 500 €/m²',
        tags: ['Forte demande', 'Rendement stable'],
        photo_alt: 'Salon à Saint-Germain',
    },
    {
        name: 'Paris 8e',
        area: "Triangle d'or",
        text: 'Adresses exclusives.',
        price: '≈ 12 500 €/m²',
        tags: ['Marché de luxe'],
        photo_alt: 'Séjour Triangle d’or',
    },
    {
        name: 'Paris 7e',
        area: 'Champ-de-Mars',
        text: 'Résidences prestigieuses.',
        price: '≈ 14 000 €/m²',
        tags: ['Offre limitée'],
        photo_alt: 'Salon haussmannien',
    },
    {
        name: 'Paris 16e',
        area: 'Passy & La Muette',
        text: 'Pour les familles.',
        price: '≈ 11 000 €/m²',
        tags: ['Demande locative'],
        photo_alt: 'Trocadéro',
    },
];

describe('BuyDistricts', () => {
    it('renders the question header and four blog-style district cards with photo, corner inlay, framed pin, title, sentence, chips and sourced price', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyDistricts items={ITEMS} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Dans quels quartiers de Paris investir ?' })).toBeInTheDocument();
        expect(screen.getByText(/Estate in Paris accompagne/)).toBeInTheDocument(); // GEO answer-first intro
        const cards = within(container.querySelector('ul.grid')!)
            .getAllByRole('listitem')
            .filter((li) => li.classList.contains('group'));
        expect(cards).toHaveLength(4);
        expect(within(cards[0]).getByRole('heading', { level: 3, name: /^Paris 6e,\s?Saint-Germain-des-Prés$/ })).toBeInTheDocument();
        expect(within(cards[0]).getByRole('img', { name: 'Salon à Saint-Germain' })).toHaveAttribute('src', '/images/buy/district-1-1600.webp');
        expect(within(cards[0]).getByRole('img')).toHaveAttribute('loading', 'lazy');
        // Facts line: one row of square outline chips (blog tags), the price as the last, bold chip, described by the dated source
        const chips = within(cards[0])
            .getAllByRole('listitem')
            .map((li) => li.textContent);
        expect(chips).toEqual(['Forte demande', 'Rendement stable', 'Prix moyen ≈ 14 500 €/m²']);
        // The arrondissement's real silhouette inlaid bottom right, read from the card's name (decorative, 2026-09-25)
        expect(cards.map((card) => card.querySelector('svg[data-arrondissement]')?.getAttribute('data-arrondissement'))).toEqual([
            '6',
            '8',
            '7',
            '16',
        ]);
        expect(cards[0].querySelector('svg[data-arrondissement] path')).toHaveClass('fill-none', 'stroke-secondary-60'); // outline only, overflowing and clipped by the card
        expect(cards[0]).toHaveClass('overflow-hidden', 'isolate');
        expect(cards[0].querySelector('svg[data-arrondissement]')).toHaveAttribute('aria-hidden', 'true');
        const chip = within(cards[0]).getByText('Forte demande');
        expect(chip.className).toMatch(/border/);
        expect(chip.className).not.toMatch(/rounded/); // square corners
        const price = within(cards[0]).getByText('≈ 14 500 €/m²');
        expect(price.closest('li')!.querySelector('[aria-hidden]')!.className).toMatch(/animate-sweep-shimmer/); // discreet shimmer
        const source = document.getElementById(price.closest('li')!.getAttribute('aria-describedby')!)!;
        expect(source).toHaveTextContent(/Notaires du Grand Paris \(2026\)/); // GEO: dated, named source, once under the grid
        expect(container.querySelectorAll('#' + CSS.escape(source.id))).toHaveLength(1);
        expect(cards[0].style.getPropertyValue('--stagger')).toBe('0ms'); // cascade on entry
        expect(cards[3].style.getPropertyValue('--stagger')).toBe('240ms');
        // The blog card: light frame, inset photo, the arrondissement inlaid in the photo corner (decorative, the h3 carries it)
        expect(cards[0].className).toMatch(/border-border/);
        const inlay = cards[0].querySelector('[aria-hidden].absolute')!;
        expect(inlay).toHaveTextContent('Paris 6e');
        expect(inlay.className).toMatch(/bg-card/);
        expect(inlay.className).not.toMatch(/rounded/);
        // Framed pin before the area name
        const h3 = within(cards[0]).getByRole('heading', { level: 3 });
        expect(h3.querySelector('span[aria-hidden] svg')).not.toBeNull();
        expect(cards.map((c) => c.className)).toEqual(Array(4).fill(cards[0].className)); // all four the same card
        expect(container.querySelectorAll('a, button')).toHaveLength(0); // no district pages yet

        expect(await axe(container)).toHaveNoViolations();
    });
});
