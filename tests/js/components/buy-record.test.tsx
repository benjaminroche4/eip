import BuyRecord from '@/components/buy/buy-record';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const FACTS = [
    { key: 'rating' as const, value: '4,9/5', title: 'Note Google', text: 'Sur 400 avis clients publiés.' },
    { key: 'reply' as const, value: '24 h', title: 'Réponse garantie', text: 'Chaque demande reçoit une réponse sous 24 h ouvrées.' },
    { key: 'languages' as const, value: 'FR · EN', title: 'Conseil bilingue', text: 'Acquéreurs français et internationaux.' },
    { key: 'address' as const, value: 'Paris 6e', title: 'Agence à Saint-Germain-des-Prés', text: 'Rue Grégoire de Tours.' },
];

describe('BuyRecord', () => {
    it('renders the header, the commitment card with the advisors and four facts distinct from the hero figures', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyRecord facts={FACTS} />);

        expect(screen.getByRole('heading', { level: 2, name: 'La confiance des propriétaires et acquéreurs à Paris' })).toBeInTheDocument();
        expect(screen.getByText(/^Estate in Paris accompagne/)).toBeInTheDocument(); // GEO answer-first intro
        expect(screen.getByRole('heading', { level: 3, name: 'Notre engagement' })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'Nos conseillers' }).querySelectorAll('li')).toHaveLength(3);
        expect(screen.getByText('Vos conseillers dédiés')).toBeInTheDocument();

        const figures = screen.getAllByRole('listitem').filter((li) => li.querySelector('h3'));
        expect(figures).toHaveLength(4);
        expect(within(figures[0]).getByRole('heading', { level: 3, name: 'Note Google' })).toBeInTheDocument();
        expect(within(figures[0]).getByText('4,9/5')).toBeInTheDocument(); // plain value, no counter (not a count)
        // The rating tile carries the Google logo (brand SVG, decorative) instead of a lucide icon (user decision 2026-09-25)
        expect(figures[0].querySelector('img')).toHaveAttribute('src', '/images/social/google.svg');
        // « FR · EN » is drawn as two flags, the text stays for assistive tech (user decision 2026-09-25)
        expect(within(figures[2]).getByText('FR · EN')).toHaveClass('sr-only');
        expect(figures[2].querySelectorAll('span[aria-hidden] svg')).toHaveLength(2);
        expect(screen.queryByText('250 M€+')).not.toBeInTheDocument(); // the hero's figures are not repeated here
        expect(figures[1].querySelector('svg')).toHaveAttribute('aria-hidden');
        expect(figures[3].className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
