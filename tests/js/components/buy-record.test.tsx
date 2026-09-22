import BuyRecord from '@/components/buy/buy-record';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const FACTS = [
    { value: '4,9/5', title: 'Note Google', text: 'Sur 400 avis clients publiés.' },
    { value: '24 h', title: 'Réponse garantie', text: 'Chaque demande reçoit une réponse sous 24 h ouvrées.' },
    { value: 'FR · EN', title: 'Conseil bilingue', text: 'Acquéreurs français et internationaux.' },
    { value: 'Paris 6e', title: 'Agence à Saint-Germain-des-Prés', text: 'Rue Grégoire de Tours.' },
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
        expect(screen.queryByText('250 M€+')).not.toBeInTheDocument(); // the hero's figures are not repeated here
        expect(figures[0].querySelector('svg')).toHaveAttribute('aria-hidden');
        expect(figures[3].className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
