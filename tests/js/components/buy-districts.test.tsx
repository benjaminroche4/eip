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
    it('renders the question header and four district cards with photo, title, sentence and facts line', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyDistricts items={ITEMS} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Dans quels quartiers de Paris investir ?' })).toBeInTheDocument();
        expect(screen.getByText(/Estate in Paris accompagne/)).toBeInTheDocument(); // GEO answer-first intro
        const cards = within(container.querySelector('ul.grid')!)
            .getAllByRole('listitem')
            .filter((li) => li.classList.contains('group'));
        expect(cards).toHaveLength(4);
        expect(within(cards[0]).getByRole('heading', { level: 3, name: /^Paris 6e,\s?Saint-Germain-des-Prés$/ })).toBeInTheDocument();
        expect(within(cards[0]).getByRole('img', { name: 'Salon à Saint-Germain' })).toHaveAttribute('src', '/images/buy/district-1-1600.jpg');
        expect(within(cards[0]).getByRole('img')).toHaveAttribute('loading', 'lazy');
        expect(cards[0]).toHaveTextContent('Prix moyen ≈ 14 500 €/m²');
        const facts = within(cards[0])
            .getAllByRole('listitem')
            .map((li) => li.textContent); // facts in small capitals, text only
        expect(facts).toEqual(['Forte demande', 'Rendement stable']);
        expect(within(cards[0]).getByText('Forte demande').closest('ul')?.className).toMatch(/uppercase/);
        expect(within(cards[0]).getByText('Forte demande').className).not.toMatch(/border|rounded|bg-/); // text only, no chip
        expect(within(cards[0]).getByText('Paris 6e').querySelector('svg')).not.toBeNull(); // thin pin before the arrondissement
        expect(within(cards[0]).getByText('Saint-Germain-des-Prés').className).toMatch(/font-normal/); // light title
        expect(cards[0].className).not.toMatch(/border/); // bare photo + text, no card frame (Figma style)
        expect(cards.map((c) => c.className)).toEqual(Array(4).fill(cards[0].className)); // all four the same size
        expect(container.querySelectorAll('a, button')).toHaveLength(0); // no district pages yet

        expect(await axe(container)).toHaveNoViolations();
    });
});
