import TrustIntro from '@/components/home/trust-intro';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('TrustIntro', () => {
    it('renders the statement with the real figure, the proof line and the two CTAs in keyboard order', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<TrustIntro figure="500+" />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('500+ biens vendus à Paris.Un interlocuteur unique.');
        expect(screen.getByRole('list', { name: 'Nos conseillers' }).querySelectorAll('li')).toHaveLength(3);
        expect(screen.getByText('4,9/5')).toBeInTheDocument();
        expect(screen.getByText(/Basé sur 400 avis/)).toBeInTheDocument(); // seo.reviews, never a made-up count
        expect(container.querySelector('img[src="/images/social/google.svg"]')).toHaveAttribute('alt', ''); // Google logo, no star
        expect(container.querySelector('svg.lucide-star')).toBeNull();
        expect(screen.getByText(/^Depuis plus de 25 ans, Estate in Paris/)).toBeInTheDocument(); // GEO sentence

        const buy = screen.getByRole('link', { name: 'Découvrir nos biens' });
        const contact = screen.getByRole('link', { name: 'Contacter un conseiller' });
        expect(buy).toHaveAttribute('href', '/acheter-immobilier-paris');
        expect(contact).toHaveAttribute('href', '/contact');
        await userEvent.tab();
        expect(buy).toHaveFocus();
        await userEvent.tab();
        expect(contact).toHaveFocus();
        expect(container.querySelectorAll('a, button')).toHaveLength(2);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('hides the proof line without real review figures', () => {
        page.props = { ...sharedProps(), seo: { ...sharedProps().seo, reviews: null } };
        renderPage(<TrustIntro figure="500+" />);

        expect(screen.queryByText(/Basé sur/)).not.toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Nos conseillers' })).not.toBeInTheDocument();
    });
});
