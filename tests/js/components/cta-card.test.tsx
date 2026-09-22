import CtaCard from '@/components/home/cta-card';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('CtaCard', () => {
    it('renders the sand card with the three advisors, the title, the text and the contact button', async () => {
        const { container } = renderPage(<CtaCard />);

        const section = screen.getByRole('region', { name: 'Parlons de votre projet immobilier à Paris' });
        expect(section).toHaveClass('border-secondary-30', 'bg-card');
        expect(within(screen.getByRole('list', { name: 'Nos conseillers' })).getAllByRole('listitem')).toHaveLength(3);
        expect(container.querySelector('[data-slot="avatar"], span.size-12')).not.toBeNull(); // larger portraits
        expect(screen.queryByText(/2 500/)).toBeNull(); // no owners pill
        expect(container.querySelector('svg path[stroke-dasharray]')).toBeNull(); // no dashed waves
        const rings = container.querySelector('div[aria-hidden] svg.animate-rings')!;
        expect(rings.querySelectorAll('circle')).toHaveLength(5); // concentric sand circles, gradient stroke, turning slowly
        expect(rings.querySelector('circle')?.getAttribute('stroke')).toMatch(/^url\(#.+\)$/); // gradient stroke, id unique per instance
        expect(screen.getByRole('link', { name: 'Contacter un conseiller' })).toHaveAttribute('href', '/contact');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('takes its own texts and destination (the « Vendre » page points to the valuation)', () => {
        renderPage(
            <CtaCard
                title="Combien vaut votre bien à Paris ?"
                text="Estimation sous 24 h."
                button="Demander une estimation"
                href="/estimation-immobiliere-paris"
            />,
        );

        expect(screen.getByRole('region', { name: 'Combien vaut votre bien à Paris ?' })).toBeInTheDocument();
        expect(screen.getByText('Estimation sous 24 h.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Demander une estimation' })).toHaveAttribute('href', '/estimation-immobiliere-paris');
        expect(screen.queryByRole('link', { name: 'Contacter un conseiller' })).toBeNull();
    });
});
