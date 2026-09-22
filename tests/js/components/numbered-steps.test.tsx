import NumberedSteps, { type Step } from '@/components/page/numbered-steps';
import { screen } from '@testing-library/react';
import { Search, Sparkles, UsersRound } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: Step[] = [
    { title: 'Estimation', text: 'Une valeur fondée sur les ventes réelles.' },
    { title: 'Mise en valeur', text: 'Photos, vidéo, plans.' },
    { title: 'Négociation et signature', text: "De l'offre à l'acte." },
];

/** The scroll lock-in, the buttons and the cascade are covered by `buy-strategies.test.tsx` (same block through its Buy wrapper). */
describe('NumberedSteps', () => {
    it('renders the header, the cross-fading photos, the icons and the id it is given (the « Vendre » steps)', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <NumberedSteps
                id="sell-process-title"
                items={ITEMS}
                texts={{
                    eyebrow: 'Notre méthode',
                    title: 'Comment vendons-nous votre bien ?',
                    intro: 'Estate in Paris vend à Paris en trois étapes.',
                }}
                photos={[
                    { src: '/images/sell/step-1-{w}.jpg', alt: 'Estimation à Paris' },
                    { src: '/images/sell/step-2-{w}.jpg', alt: '' },
                    { src: '/images/sell/step-3-{w}.jpg', alt: '' },
                ]}
                icons={[Search, Sparkles, UsersRound]}
            />,
        );

        const section = screen.getByRole('region', { name: 'Comment vendons-nous votre bien ?' });
        expect(section.querySelector('h2')).toHaveAttribute('id', 'sell-process-title');
        expect(screen.getByText('Notre méthode')).toBeInTheDocument();
        expect(screen.getByText('Estate in Paris vend à Paris en trois étapes.')).toBeInTheDocument();
        const photos = container.querySelectorAll('img');
        expect(photos[0]).toHaveAttribute('src', '/images/sell/step-1-1600.jpg');
        expect(photos[0]).toHaveAttribute('srcset', '/images/sell/step-1-800.jpg 800w, /images/sell/step-1-1600.jpg 1600w');
        expect(photos[0]).toHaveAccessibleName('Estimation à Paris');
        expect(photos[2]).toHaveAttribute('src', '/images/sell/step-3-1600.jpg');
        expect(photos[2]).toHaveAttribute('alt', '');
        expect(screen.getAllByRole('button')).toHaveLength(3);

        expect(await axe(container)).toHaveNoViolations();
    });
});
