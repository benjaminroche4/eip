import BuyHero, { type BuyStat } from '@/components/buy/buy-hero';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const STATS: BuyStat[] = [
    { value: '250 M€+', title: 'Transactions réalisées', text: '' },
    { value: '25+', title: "Années d'expertise du marché", text: '' },
    { value: '500+', title: 'Biens vendus et loués', text: '' },
    { value: '120+', title: 'Acquéreurs qualifiés actifs chaque mois', text: '' },
];

describe('BuyHero', () => {
    it('renders the header, the CTA, the photo and the key figures, without a play button when no video is configured', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyHero stats={STATS} video={null} />);

        expect(
            screen.getByRole('heading', { level: 1, name: "Trouvez l'appartement ou l'hôtel particulier qui vous ressemble à Paris" }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Parler à un conseiller' })).toHaveAttribute('href', '/contact');
        expect(screen.getByRole('img', { name: /haussmannienne/ })).toHaveAttribute('src', '/images/home/hero-2000.jpg');
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.getAllByText('25+')).toHaveLength(2); // desktop (over the photo) + mobile (under it), one hidden per breakpoint
        expect(screen.getAllByRole('list', { name: 'Chiffres clés', hidden: true })).toHaveLength(2); // on the photo (desktop) + first row of the 2×2 grid (mobile)
        expect(screen.getAllByText('250 M€+')[0].closest('li')?.textContent).toMatch(/^250 M€\+/); // value first, label under it

        expect(await axe(container)).toHaveNoViolations();
    });

    it('loads the privacy-enhanced YouTube iframe when the play button is activated with the keyboard', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        renderPage(<BuyHero stats={STATS} video="abc123" />);

        const play = screen.getByRole('button', { name: 'Lire la vidéo de présentation' });
        await user.tab();
        await user.tab(); // the CTA link, then the play button
        expect(play).toHaveFocus();
        await user.keyboard('{Enter}');

        const frame = screen.getByTitle('Estate in Paris, acheter un bien de prestige à Paris');
        expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123?autoplay=1');
        expect(screen.queryByRole('button')).toBeNull();
        expect(frame).toHaveFocus(); // the button is gone: the keyboard reader lands on the player, not on the body
        expect(screen.getAllByText('25+')).toHaveLength(1); // the figures stay, under the video
    });
});
