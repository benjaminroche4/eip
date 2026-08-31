import TrustBanner from '@/components/home/trust-banner';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('TrustBanner', () => {
    it('renders the four service cards as links beside the trust content, with slider arrows', async () => {
        const { container } = renderPage(<TrustBanner />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('propriétaires accompagnés');
        const cards = [/Acheter un bien/, /Vendre un bien/, /Estimation/, /Relocation/].map((name) => screen.getByRole('link', { name }));
        expect(cards[0]).toHaveAttribute('href', '/acheter-immobilier-paris');
        expect(cards[1]).toHaveAttribute('href', '/vendre-immobilier-paris');
        expect(cards[2]).toHaveAttribute('href', '/estimation-immobiliere-paris');
        expect(screen.getByRole('button', { name: 'Services précédents' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Services suivants' })).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });
});
