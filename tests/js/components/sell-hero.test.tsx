import SellHero from '@/components/sell/sell-hero';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const STATS = [
    { value: '250 M€+', title: 'Transactions réalisées', text: '' },
    { value: '25+', title: "Années d'expertise du marché", text: '' },
    { value: '500+', title: 'Biens vendus et loués', text: '' },
    { value: '120+', title: 'Acquéreurs qualifiés actifs chaque mois', text: '' },
];

describe('SellHero', () => {
    it('is the Buy header with the Sell wording: eyebrow, h1, intro, valuation button, the background clip and the key figures', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<SellHero stats={STATS} video={null} />);

        expect(screen.getByRole('heading', { level: 1, name: 'Vendez votre bien de prestige à Paris au juste prix' })).toBeInTheDocument();
        expect(screen.getByText('Vendre à Paris')).toBeInTheDocument(); // eyebrow
        expect(screen.getByText(/Estate in Paris accompagne la vente/)).toBeInTheDocument(); // GEO answer-first intro
        const cta = screen.getByRole('link', { name: 'Faire estimer mon bien' });
        expect(cta).toHaveAttribute('href', '/estimation-immobiliere-paris');
        expect(cta.className).toContain('bg-primary'); // the page's single full button (with the closing card)
        // The owner's clip in place of the photo (2026-09-23): decorative, poster = its first frame, the alt kept as a hidden caption
        const clip = container.querySelector('video')!;
        expect(clip).toHaveAttribute('aria-hidden');
        expect(clip).toHaveAttribute('poster', '/images/sell/hero-poster-1280.jpg');
        expect(clip.querySelectorAll('source')[2]).toHaveAttribute('src', '/videos/sell/hero-1280.webm');
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText(/tour Eiffel/)).toHaveClass('sr-only');
        expect(within(screen.getAllByRole('list', { name: 'Chiffres clés' })[0]).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
        expect(screen.queryByRole('button')).toBeNull(); // no video configured: no play button
        expect(screen.queryByText('Confidentiel')).toBeNull(); // the earlier trust / proof lines are gone (exact Buy header)
        expect(container.querySelectorAll('a')).toHaveLength(1);

        expect(await axe(container, { preload: false })).toHaveNoViolations(); // preload: axe waits for the clip's metadata, which jsdom never loads
    });
});
