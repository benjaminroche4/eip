import BuyRecord from '@/components/buy/buy-record';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const STATS = [
    { value: '250 M€+', title: 'Transactions réalisées', text: 'Dans les quartiers les plus prisés de Paris.' },
    { value: '25+', title: "Années d'expertise du marché", text: 'Sur le marché immobilier de prestige parisien.' },
    { value: '500+', title: 'Biens vendus et loués', text: "Résidences de prestige et biens d'investissement." },
    { value: '120+', title: 'Acquéreurs qualifiés actifs chaque mois', text: "Accédez à notre réseau d'acheteurs sérieux." },
];

describe('BuyRecord', () => {
    it('renders the header, the commitment card with the real review count and the four figures', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyRecord stats={STATS} />);

        expect(screen.getByRole('heading', { level: 2, name: 'La confiance des propriétaires et acquéreurs à Paris' })).toBeInTheDocument();
        expect(screen.getByText(/^Estate in Paris accompagne/)).toBeInTheDocument(); // GEO answer-first intro
        expect(screen.getByRole('heading', { level: 3, name: 'Notre engagement' })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'Nos conseillers' }).querySelectorAll('li')).toHaveLength(3);
        expect(screen.getByText(/Recommandé par 400 clients sur Google/)).toBeInTheDocument(); // seo.reviews, never a made-up figure

        const figures = screen.getAllByRole('listitem').filter((li) => li.querySelector('h3'));
        expect(figures).toHaveLength(4);
        expect(within(figures[0]).getByRole('heading', { level: 3, name: 'Transactions réalisées' })).toBeInTheDocument();
        expect(within(figures[0]).getByText('250 M€+', { selector: '.sr-only' })).toBeInTheDocument(); // final value readable from the start
        expect(figures[0].querySelector('svg')).toHaveAttribute('aria-hidden');
        expect(figures[3].className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('hides the proof line without real review figures', () => {
        page.props = { ...sharedProps(), seo: { ...sharedProps().seo, reviews: null } };
        renderPage(<BuyRecord stats={STATS} />);

        expect(screen.queryByText(/sur Google/)).not.toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'Nos conseillers' })).toBeInTheDocument();
    });
});
