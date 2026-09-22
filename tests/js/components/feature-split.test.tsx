import FeatureSplit from '@/components/page/feature-split';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('FeatureSplit', () => {
    it('renders the question header, the check list and one described photo, nothing interactive', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <FeatureSplit
                id="split-title"
                eyebrow="Vente confidentielle"
                title="Faut-il rendre votre vente publique ?"
                intro="Non : Estate in Paris propose la vente confidentielle hors marché à Paris."
                points={['Aucune annonce publique', 'Acquéreurs qualifiés']}
                image={{ src: '/img-1600.jpg', srcSet: '/img-800.jpg 800w, /img-1600.jpg 1600w', alt: 'Chambre contemporaine' }}
            />,
        );

        expect(screen.getByRole('region', { name: 'Faut-il rendre votre vente publique ?' })).toBeInTheDocument();
        expect(screen.getByText(/^Non : Estate in Paris/)).toBeInTheDocument(); // GEO answer-first
        expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Aucune annonce publique', 'Acquéreurs qualifiés']);
        expect(screen.getByRole('img', { name: 'Chambre contemporaine' })).toHaveAttribute('loading', 'lazy');
        expect(container.querySelector('section')).toHaveClass('lg:grid-cols-2');
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
